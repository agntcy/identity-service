// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package idp

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"path"
	"time"

	"github.com/agntcy/identity-service/internal/core/settings/types"
	"github.com/agntcy/identity-service/pkg/log"
	duosdk "github.com/duosecurity/duo_api_golang"
	"github.com/google/uuid"
)

const (
	duoTimeout    = 10 // seconds
	duoClientName = "duo-client"
)

type integration struct {
	Response struct {
		Sso struct {
			IdpMetadata struct {
				Issuer string `json:"issuer"`
			} `json:"idp_metadata"`
			OauthConfig struct {
				Clients []struct {
					ClientId     string `json:"client_id"`
					ClientSecret string `json:"client_secret"`
				} `json:"clients"`
			} `json:"oauth_config"`
		} `json:"sso"`
	} `json:"response"`
}

type DuoIdp struct {
	settings *types.DuoIdpSettings
	api      *duosdk.DuoApi
}

func NewDuoIdp(settings *types.DuoIdpSettings) Idp {
	return &DuoIdp{
		settings: settings,
	}
}

func (d *DuoIdp) TestSettings(ctx context.Context) error {
	if d.settings == nil {
		return errors.New("duo idp settings are not configured")
	}

	d.api = duosdk.NewDuoApi(
		d.settings.IntegrationKey,
		d.settings.SecretKey,
		d.settings.Hostname,
		duoClientName,
		duosdk.SetTimeout(duoTimeout*time.Second))

	_, err := d.duoCall(
		"GET",
		"/admin/v3/integrations",
		duosdk.JSONParams{},
	)

	return err
}

func (d *DuoIdp) CreateClientCredentialsPair(
	ctx context.Context,
) (*ClientCredentials, error) {
	log.FromContext(ctx).Debug("Creating client credentials pair for Duo IdP")

	// Create a custom scope
	scopeId := uuid.NewString()

	// Create a custom client id
	clientId := uuid.NewString()

	// Get client name
	clientName := getName()

	paylod := duosdk.JSONParams{
		"name": clientName,
		"type": "sso-oauth-client-credentials",
		"sso": duosdk.JSONParams{
			"oauth_config": duosdk.JSONParams{
				"scopes": []duosdk.JSONParams{
					{
						"id":   scopeId,
						"name": customScope,
					},
				},
				"clients": []duosdk.JSONParams{
					{
						"name":                clientName,
						"client_id":           clientId,
						"assigned_scopes_ids": []string{scopeId},
					},
				},
			},
		},
	}

	data, err := d.duoCall(
		"POST",
		"/admin/v3/integrations",
		paylod,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create client credentials pair in Duo IdP: %w", err)
	}

	var integrationData integration
	if err := json.Unmarshal(data, &integrationData); err != nil {
		return nil, fmt.Errorf("failed to unmarshal Duo IdP integration data: %w", err)
	}

	return &ClientCredentials{
		ClientID:     integrationData.Response.Sso.OauthConfig.Clients[0].ClientId,
		ClientSecret: integrationData.Response.Sso.OauthConfig.Clients[0].ClientSecret,
		Issuer:       integrationData.Response.Sso.IdpMetadata.Issuer,
	}, nil
}

func (d *DuoIdp) DeleteClientCredentialsPair(
	ctx context.Context,
	clientCredentials *ClientCredentials,
) error {
	return d.deleteIntegration(clientCredentials)
}

func (d *DuoIdp) deleteIntegration(clientCredentials *ClientCredentials) error {
	if clientCredentials == nil || clientCredentials.Issuer == "" {
		return fmt.Errorf("client credentials are not provided or issuer is empty")
	}

	integrationKey := path.Base(clientCredentials.Issuer)

	// Prepare the path for the DELETE request
	deletePath := fmt.Sprintf("/admin/v3/integrations/%s", integrationKey)

	// Call the Duo API to delete the client credentials pair
	_, err := d.duoCall(
		"DELETE",
		deletePath,
		duosdk.JSONParams{},
	)
	if err != nil {
		return fmt.Errorf(
			"failed to delete client credentials pair for issuer %s: %w",
			clientCredentials.Issuer,
			err,
		)
	}

	return nil
}

func (d *DuoIdp) duoCall(
	method, callPath string, params duosdk.JSONParams) ([]byte, error) {
	response, data, err := d.api.JSONSignedCall(
		method,
		callPath,
		params,
		duosdk.UseTimeout,
	)

	// Ensure the response body is closed after use to prevent resource leaks.
	defer func() {
		if response != nil {
			_ = response.Body.Close()
		}
	}()

	if err != nil {
		return nil, fmt.Errorf(
			"duo API call failed: %s: %w",
			string(data),
			err,
		)
	}

	if response.StatusCode != http.StatusOK {
		return nil, fmt.Errorf(
			"duo API call failed: %s, status code: %d: %w",
			string(data), response.StatusCode,
			err,
		)
	}

	return data, nil
}
