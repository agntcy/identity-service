// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package idp

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"path"
	"strings"

	"github.com/agntcy/identity-platform/internal/core/settings/types"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/pkg/log"
	"github.com/google/uuid"
	oktasdk "github.com/okta/okta-sdk-golang/v5/okta"
)

const (
	oktaScopes        = "okta.apps.read,okta.apps.manage"
	oktaTimeout       = 10 // seconds
	oktaAuthorization = "PrivateKey"
)

type OktaIdp struct {
	IdpSettings *types.OktaIdpSettings
	api         *oktasdk.APIClient
}

func (d *OktaIdp) TestSettings(ctx context.Context) error {
	if d.IdpSettings == nil {
		return errutil.Err(
			nil,
			"okta idp settings are not configured",
		)
	}

	// Attempt to create a new Okta API client configuration
	config, err := oktasdk.NewConfiguration(
		oktasdk.WithOrgUrl(d.IdpSettings.Domain),
		oktasdk.WithAuthorizationMode(oktaAuthorization),
		oktasdk.WithPrivateKey(d.getPrivateKey()),
		oktasdk.WithScopes(strings.Split(oktaScopes, ",")),
		oktasdk.WithRequestTimeout(oktaTimeout),
	)
	if err != nil {
		return errutil.Err(
			err,
			"failed to create Okta API client",
		)
	}

	// Create a new Okta API client with the provided configuration
	d.api = oktasdk.NewAPIClient(config)

	return err
}

func (d *OktaIdp) getPrivateKey() (string, err) {
	if d.IdpSettings == nil || d.IdpSettings.PrivateKey == "" {
		return "", errutil.Err(
			fmt.Errorf("private key is not configured"),
			"okta idp private key is not set",
		)
	}

	// Create api key
	rawKey := *p.directory.ApiSecret
	size := len(rawKey) / privateKeyLineSize

	privateKey := "-----BEGIN PRIVATE KEY-----\n"
	for i := 0; i < size-1; i++ {
		privateKey += rawKey[i*privateKeyLineSize:(i+1)*privateKeyLineSize] + "\n"
	}

	privateKey += rawKey[(size-1)*privateKeyLineSize:] + "\n-----END PRIVATE KEY-----"
}

func (d *OktaIdp) CreateClientCredentialsPair(
	ctx context.Context,
) (*ClientCredentials, error) {
	log.Debug("Creating client credentials pair for Okta IdP")

	// Create a custom scope
	scopeId := uuid.NewString()

	// Create a custom client id
	clientId := uuid.NewString()

	// Get client name
	clientName := getName()

	paylod := oktasdk.JSONParams{
		"name": clientName,
		"type": "sso-oauth-client-credentials",
		"sso": oktasdk.JSONParams{
			"oauth_config": oktasdk.JSONParams{
				"scopes": []oktasdk.JSONParams{
					{
						"id":   scopeId,
						"name": customScope,
					},
				},
				"clients": []oktasdk.JSONParams{
					{
						"name":                clientName,
						"client_id":           clientId,
						"assigned_scopes_ids": []string{scopeId},
					},
				},
			},
		},
	}

	data, err := d.oktaCall(
		"POST",
		"/admin/v3/integrations",
		paylod,
	)
	if err != nil {
		return nil, errutil.Err(
			err,
			"failed to create client credentials pair in Okta IdP",
		)
	}

	var integrationData integration
	if err := json.Unmarshal(data, &integrationData); err != nil {
		return nil, errutil.Err(
			err,
			"failed to unmarshal Okta IdP integration data",
		)
	}

	return &ClientCredentials{
		ClientID:     integrationData.Response.Sso.OauthConfig.Clients[0].ClientId,
		ClientSecret: integrationData.Response.Sso.OauthConfig.Clients[0].ClientSecret,
		Issuer:       integrationData.Response.Sso.IdpMetadata.Issuer,
	}, nil
}

func (d *OktaIdp) DeleteClientCredentialsPair(
	ctx context.Context,
	clientCredentials *ClientCredentials,
) error {
	if clientCredentials == nil || clientCredentials.Issuer == "" {
		return fmt.Errorf("client credentials are not provided or issuer is empty")
	}

	integrationKey := path.Base(clientCredentials.Issuer)

	// Prepare the path for the DELETE request
	deletePath := fmt.Sprintf("/admin/v3/integrations/%s", integrationKey)

	// Call the Okta API to delete the client credentials pair
	_, err := d.oktaCall(
		"DELETE",
		deletePath,
		oktasdk.JSONParams{},
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

func (d *OktaIdp) oktaCall(
	method, callPath string, params oktasdk.JSONParams) ([]byte, error) {
	response, data, err := d.api.JSONSignedCall(
		method,
		callPath,
		params,
		oktasdk.UseTimeout,
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
			fmt.Sprintf("okta API call failed: %s, status code: %d",
				string(data), response.StatusCode),
		)
	}

	return data, nil
}
