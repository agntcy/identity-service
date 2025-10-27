// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package idp

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/agntcy/identity-service/internal/core/settings/types"
	"github.com/agntcy/identity-service/pkg/log"
)

const (
	keycloakGrantType  = "client_credentials"
	defaultHTTPTimeout = 30 * time.Second
)

type KeycloakIdp struct {
	settings   *types.KeycloakIdpSettings
	httpClient *http.Client
}

func NewKeycloakIdp(settings *types.KeycloakIdpSettings) Idp {
	return &KeycloakIdp{
		settings: &types.KeycloakIdpSettings{
			BaseUrl:      strings.TrimSuffix(settings.BaseUrl, "/"),
			Realm:        settings.Realm,
			ClientID:     settings.ClientID,
			ClientSecret: settings.ClientSecret,
		},
		httpClient: &http.Client{
			Timeout: defaultHTTPTimeout,
		},
	}
}

func (k *KeycloakIdp) TestSettings(ctx context.Context) error {
	if k.settings == nil {
		return errors.New("keycloak idp settings are not configured")
	}

	// Test connection by getting realm info
	realmURL := fmt.Sprintf("%s/realms/%s",
		k.settings.BaseUrl,
		k.settings.Realm)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, realmURL, http.NoBody)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := k.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to connect to Keycloak: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)

		return fmt.Errorf("failed to connect to Keycloak realm: status %d, body: %s",
			resp.StatusCode, string(body))
	}

	// Test client credentials by attempting to get a token
	_, err = k.getAccessToken(ctx)
	if err != nil {
		return fmt.Errorf("failed to authenticate with Keycloak: %w", err)
	}

	return nil
}

func (k *KeycloakIdp) CreateClientCredentialsPair(
	ctx context.Context,
) (*ClientCredentials, error) {
	log.FromContext(ctx).Debug("Creating client credentials pair for Keycloak IdP")

	// Get admin access token
	accessToken, err := k.getAccessToken(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get admin access token: %w", err)
	}

	// Create a new client in Keycloak
	clientID := getName()

	err = k.createClient(ctx, accessToken, clientID)
	if err != nil {
		return nil, fmt.Errorf("failed to create client in Keycloak: %w", err)
	}

	// Get the client's internal ID
	internalClientID, err := k.getClientInternalID(ctx, accessToken, clientID)
	if err != nil {
		return nil, fmt.Errorf("failed to get client internal ID: %w", err)
	}

	// Get the client secret
	clientSecret, err := k.getClientSecret(ctx, accessToken, internalClientID)
	if err != nil {
		return nil, fmt.Errorf("failed to get client secret: %w", err)
	}

	return &ClientCredentials{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		Issuer:       fmt.Sprintf("%s/realms/%s", k.settings.BaseUrl, k.settings.Realm),
	}, nil
}

func (k *KeycloakIdp) DeleteClientCredentialsPair(
	ctx context.Context,
	clientCredentials *ClientCredentials,
) error {
	log.FromContext(ctx).Debug("Deleting client credentials pair for Keycloak IdP")

	// Get admin access token
	accessToken, err := k.getAccessToken(ctx)
	if err != nil {
		return fmt.Errorf("failed to get admin access token: %w", err)
	}

	// Get the client's internal ID
	internalClientID, err := k.getClientInternalID(ctx, accessToken, clientCredentials.ClientID)
	if err != nil {
		return fmt.Errorf("failed to get client internal ID: %w", err)
	}

	// Delete the client
	clientURL := fmt.Sprintf("%s/admin/realms/%s/clients/%s",
		k.settings.BaseUrl,
		k.settings.Realm,
		internalClientID)

	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, clientURL, http.NoBody)
	if err != nil {
		return fmt.Errorf("failed to create delete request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := k.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to delete client: %w", err)
	}

	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)

		return fmt.Errorf("failed to delete client: status %d, body: %s",
			resp.StatusCode, string(body))
	}

	return nil
}

// Helper methods

func (k *KeycloakIdp) getAccessToken(ctx context.Context) (string, error) {
	tokenURL := fmt.Sprintf("%s/realms/%s/protocol/openid-connect/token",
		k.settings.BaseUrl,
		k.settings.Realm)

	data := url.Values{}
	data.Set("grant_type", keycloakGrantType)
	data.Set("client_id", k.settings.ClientID)
	data.Set("client_secret", k.settings.ClientSecret)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, tokenURL,
		strings.NewReader(data.Encode()))
	if err != nil {
		return "", fmt.Errorf("failed to create token request: %w", err)
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := k.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to get token: %w", err)
	}

	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)

		return "", fmt.Errorf("failed to get token: status %d, body: %s",
			resp.StatusCode, string(body))
	}

	var tokenResp struct {
		AccessToken string `json:"access_token"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return "", fmt.Errorf("failed to decode token response: %w", err)
	}

	return tokenResp.AccessToken, nil
}

func (k *KeycloakIdp) createClient(ctx context.Context, accessToken, clientID string) error {
	clientsURL := fmt.Sprintf("%s/admin/realms/%s/clients",
		k.settings.BaseUrl,
		k.settings.Realm)

	clientData := map[string]interface{}{
		"clientId":                     clientID,
		"enabled":                      true,
		"protocol":                     "openid-connect",
		"publicClient":                 false,
		"serviceAccountsEnabled":       true,
		"standardFlowEnabled":          false,
		"directAccessGrantsEnabled":    false,
		"authorizationServicesEnabled": false,
	}

	jsonData, err := json.Marshal(clientData)
	if err != nil {
		return fmt.Errorf("failed to marshal client data: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, clientsURL,
		strings.NewReader(string(jsonData)))
	if err != nil {
		return fmt.Errorf("failed to create client request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := k.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to create client: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return fmt.Errorf("failed to read response body: %w", err)
		}
		return fmt.Errorf("failed to create client: status %d, body: %s",
			resp.StatusCode, string(body))
	}

	return nil
}

func (k *KeycloakIdp) getClientInternalID(ctx context.Context, accessToken, clientID string) (string, error) {
	clientsURL := fmt.Sprintf("%s/admin/realms/%s/clients?clientId=%s",
		k.settings.BaseUrl,
		k.settings.Realm,
		url.QueryEscape(clientID))

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, clientsURL, http.NoBody)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := k.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to get clients: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return "", fmt.Errorf("failed to read response body: %w", err)
		}
		return "", fmt.Errorf("failed to get clients: status %d, body: %s",
			resp.StatusCode, string(body))
	}

	var clients []struct {
		ID       string `json:"id"`
		ClientID string `json:"clientId"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&clients); err != nil {
		return "", fmt.Errorf("failed to decode clients response: %w", err)
	}

	if len(clients) == 0 {
		return "", fmt.Errorf("client not found: %s", clientID)
	}

	return clients[0].ID, nil
}

func (k *KeycloakIdp) getClientSecret(ctx context.Context, accessToken, internalClientID string) (string, error) {
	secretURL := fmt.Sprintf("%s/admin/realms/%s/clients/%s/client-secret",
		k.settings.BaseUrl,
		k.settings.Realm,
		internalClientID)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, secretURL, http.NoBody)
	if err != nil {
		return "", fmt.Errorf("failed to create secret request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := k.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to get client secret: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return "", fmt.Errorf("failed to read response body: %w", err)
		}
		return "", fmt.Errorf("failed to get client secret: status %d, body: %s",
			resp.StatusCode, string(body))
	}

	var secretResp struct {
		Value string `json:"value"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&secretResp); err != nil {
		return "", fmt.Errorf("failed to decode secret response: %w", err)
	}

	return secretResp.Value, nil
}
