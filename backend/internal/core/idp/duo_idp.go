// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package idp

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"path"
	"time"

	"github.com/agntcy/identity-platform/internal/core/settings/types"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/pkg/log"
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
	IdpSettings *types.DuoIdpSettings
	api         *duosdk.DuoApi
}

func (d *DuoIdp) TestSettings(ctx context.Context) error {
	if d.IdpSettings == nil {
		return errutil.Err(
			nil,
			"duo idp settings are not configured",
		)
	}

	d.api = duosdk.NewDuoApi(
		d.IdpSettings.IntegrationKey,
		d.IdpSettings.SecretKey,
		d.IdpSettings.Hostname,
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
	log.Debug("Creating client credentials pair for Duo IdP")

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
		return nil, errutil.Err(
			err,
			"failed to create client credentials pair in Duo IdP",
		)
	}

	var integrationData integration
	if err := json.Unmarshal(data, &integrationData); err != nil {
		return nil, errutil.Err(
			err,
			"failed to unmarshal Duo IdP integration data",
		)
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
	if clientCredentials == nil || clientCredentials.Issuer == "" {
		return fmt.Errorf("client credentials are not provided or issuer is empty")
	}

	integrationKey := path.Base(clientCredentials.Issuer)

	// Prepare the path for the DELETE request
	path := fmt.Sprintf("/admin/v3/integrations/%s", integrationKey)

	// Call the Duo API to delete the client credentials pair
	_, err := d.duoCall(
		"DELETE",
		path,
		duosdk.JSONParams{},
	)
	if err != nil {
		return errutil.Err(
			err,
			fmt.Sprintf(
				"failed to delete client credentials pair for issuer %s",
				clientCredentials.Issuer,
			),
		)
	}

	return nil
}

func (d *DuoIdp) duoCall(
	method, path string, params duosdk.JSONParams) ([]byte, error) {
	response, data, err := d.api.JSONSignedCall(
		method,
		path,
		params,
		duosdk.UseTimeout,
	)

	// Ensure the response body is closed after use to prevent resource leaks.
	defer func() {
		if response != nil {
			_ = response.Body.Close()
		}
	}()

	if err != nil || response.StatusCode != http.StatusOK {
		return nil, errutil.Err(
			err,
			fmt.Sprintf("duo API call failed: %s, status code: %d",
				string(data), response.StatusCode),
		)
	}

	return data, nil
}
