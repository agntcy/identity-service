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
	"slices"
	"strings"
	"time"

	"github.com/agntcy/identity-service/internal/core/settings/types"
	"github.com/agntcy/identity-service/pkg/log"
)

const (
	pingTimeout         = 30 * time.Second
	pingGrantType       = "client_credentials"
	pingScopes          = "openid"
	pingApplicationType = "WORKER"
	pingTokenEndpoint   = "/as/token"
	pingApplicationsAPI = "/environments/%s/applications"
	pingProtocol        = "OPENID_CONNECT"
	pingRegions         = "com,eu,com.au,ca"
)

type PingIdp struct {
	settings   *types.PingIdpSettings
	httpClient *http.Client
	apiBaseURL string
	authURL    string
}

func NewPingIdp(settings *types.PingIdpSettings) Idp {
	region := "com"
	if settings != nil && settings.Region != "" &&
		slices.Contains(strings.Split(pingRegions, ","), settings.Region) {
		region = settings.Region
	}

	return &PingIdp{
		settings:   settings,
		httpClient: &http.Client{Timeout: pingTimeout},
		apiBaseURL: fmt.Sprintf("https://api.pingone.%s/v1", region),
		authURL:    fmt.Sprintf("https://auth.pingone.%s", region),
	}
}

func (p *PingIdp) TestSettings(ctx context.Context) error {
	if p.settings == nil {
		return errors.New("ping idp settings are not configured")
	}

	if p.settings.EnvironmentID == "" {
		return errors.New("environment ID is required")
	}

	if p.settings.ClientID == "" {
		return errors.New("client ID is required")
	}

	if p.settings.ClientSecret == "" {
		return errors.New("client secret is required")
	}

	accessToken, err := p.getAccessToken(ctx)
	if err != nil {
		return fmt.Errorf("failed to authenticate with PingOne: %w", err)
	}

	applicationsURL := fmt.Sprintf("%s%s",
		p.apiBaseURL,
		fmt.Sprintf(pingApplicationsAPI, p.settings.EnvironmentID))

	log.Debug("Verifying PingOne connection by accessing applications at :", applicationsURL)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, applicationsURL, http.NoBody)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to connect to PingOne: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)

		return fmt.Errorf("failed to verify PingOne connection: status %d, body: %s",
			resp.StatusCode, string(body))
	}

	return nil
}

func (p *PingIdp) CreateClientCredentialsPair(
	ctx context.Context,
) (*ClientCredentials, error) {
	log.FromContext(ctx).Debug("Creating client credentials pair for Ping IdP")

	accessToken, err := p.getAccessToken(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get access token: %w", err)
	}

	clientName := getName()

	applicationsURL := fmt.Sprintf("%s%s",
		p.apiBaseURL,
		fmt.Sprintf(pingApplicationsAPI, p.settings.EnvironmentID))

	applicationData := map[string]any{
		"name":                    clientName,
		"type":                    pingApplicationType,
		"protocol":                pingProtocol,
		"enabled":                 true,
		"tokenEndpointAuthMethod": "CLIENT_SECRET_BASIC",
		"grantTypes": []string{
			strings.ToUpper(pingGrantType),
		},
	}

	jsonData, err := json.Marshal(applicationData)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal application data: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, applicationsURL,
		strings.NewReader(string(jsonData)))
	if err != nil {
		return nil, fmt.Errorf("failed to create application request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to create application: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to create application: status %d, body: %s",
			resp.StatusCode, string(body))
	}

	var appResp struct {
		ID string `json:"id"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&appResp); err != nil {
		return nil, fmt.Errorf("failed to decode application response: %w", err)
	}

	clientSecret, err := p.getApplicationSecret(ctx, accessToken, appResp.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get application secret: %w", err)
	}

	issuer := fmt.Sprintf("%s/%s/as", p.authURL, p.settings.EnvironmentID)

	return &ClientCredentials{
		ClientID:     appResp.ID,
		ClientSecret: clientSecret,
		Issuer:       issuer,
	}, nil
}

func (p *PingIdp) DeleteClientCredentialsPair(
	ctx context.Context,
	clientCredentials *ClientCredentials,
) error {
	log.FromContext(ctx).Debug("Deleting client credentials pair for Ping IdP")

	if clientCredentials == nil || clientCredentials.ClientID == "" {
		return fmt.Errorf("client credentials are not provided or client ID is empty")
	}

	accessToken, err := p.getAccessToken(ctx)
	if err != nil {
		return fmt.Errorf("failed to get access token: %w", err)
	}

	applicationURL := fmt.Sprintf("%s%s/%s",
		p.apiBaseURL,
		fmt.Sprintf(pingApplicationsAPI, p.settings.EnvironmentID),
		clientCredentials.ClientID)

	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, applicationURL, http.NoBody)
	if err != nil {
		return fmt.Errorf("failed to create delete request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to delete application: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)

		return fmt.Errorf("failed to delete application: status %d, body: %s",
			resp.StatusCode, string(body))
	}

	return nil
}

func (p *PingIdp) getAccessToken(ctx context.Context) (string, error) {
	tokenURL := fmt.Sprintf("%s/%s%s",
		p.authURL,
		p.settings.EnvironmentID,
		pingTokenEndpoint)

	data := fmt.Sprintf("scope=%s&grant_type=%s", pingScopes, pingGrantType)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, tokenURL,
		strings.NewReader(data))
	if err != nil {
		return "", fmt.Errorf("failed to create token request: %w", err)
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.SetBasicAuth(p.settings.ClientID, p.settings.ClientSecret)

	resp, err := p.httpClient.Do(req)
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

func (p *PingIdp) getApplicationSecret(ctx context.Context, accessToken, applicationID string) (string, error) {
	secretURL := fmt.Sprintf("%s%s/%s/secret",
		p.apiBaseURL,
		fmt.Sprintf(pingApplicationsAPI, p.settings.EnvironmentID),
		applicationID)

	secretData := map[string]any{
		"previous": map[string]any{
			"expiresAt": nil,
		},
	}

	jsonData, err := json.Marshal(secretData)
	if err != nil {
		return "", fmt.Errorf("failed to marshal secret data: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, secretURL,
		strings.NewReader(string(jsonData)))
	if err != nil {
		return "", fmt.Errorf("failed to create secret request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to get application secret: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)

		return "", fmt.Errorf("failed to get application secret: status %d, body: %s",
			resp.StatusCode, string(body))
	}

	var secretResp struct {
		Secret string `json:"secret"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&secretResp); err != nil {
		return "", fmt.Errorf("failed to decode secret response: %w", err)
	}

	if secretResp.Secret == "" {
		return "", errors.New("application secret is empty in response")
	}

	return secretResp.Secret, nil
}
