// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package idp

import (
	"context"
	"fmt"
	"io"
	"net/http"

	"github.com/agntcy/identity-platform/internal/core/settings/types"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/internal/pkg/ptrutil"
	"github.com/agntcy/identity-platform/pkg/log"
	orysdk "github.com/ory/client-go"
)

const (
	oryTimeout                = 10 // seconds
	oryClientName             = "ory-client"
	oryClientCredentials      = "client_credentials"
	oryToken                  = "token"
	oryJwtAccessTokenStrategy = "jwt"
)

type OryIdp struct {
	settings *types.OryIdpSettings
	api      *orysdk.OAuth2Client
}

func NewOryIdp(settings *types.OryIdpSettings) Idp {
	return &OryIdp{
		settings: settings,
	}
}

func (d *OryIdp) TestSettings(ctx context.Context) error {
	if d.settings == nil {
		return errutil.Err(
			nil,
			"ory idp settings are not configured",
		)
	}

	_, body, err := d.getClient().
		OAuth2API.ListOAuth2Clients(context.WithValue(ctx, orysdk.ContextAccessToken, d.settings.ApiKey)).
		ClientName(oryClientName).
		Execute() //nolint:bodyclose // the response body is closed in oryParseAPIResponse

	err = d.oryParseAPIResponse(err, body)
	if err != nil {
		return errutil.Err(
			err,
			"failed to connect to Ory IdP",
		)
	}

	return nil
}

func (d *OryIdp) CreateClientCredentialsPair(
	ctx context.Context,
) (*ClientCredentials, error) {
	log.Debug("Creating client credentials pair for Ory IdP")

	// Get client name
	clientName := getName()

	oAuth2Client := *orysdk.NewOAuth2Client()
	oAuth2Client.SetClientName(clientName)
	oAuth2Client.SetGrantTypes([]string{oryClientCredentials})
	oAuth2Client.SetResponseTypes([]string{oryToken})
	oAuth2Client.SetAccessTokenStrategy(oryJwtAccessTokenStrategy)

	resp, body, err := d.getClient().
		OAuth2API.CreateOAuth2Client(context.WithValue(ctx, orysdk.ContextAccessToken, d.settings.ApiKey)).
		OAuth2Client(oAuth2Client).
		Execute() //nolint:bodyclose // the response body is closed in oryParseAPIResponse

	err = d.oryParseAPIResponse(err, body)
	if err != nil {
		return nil, errutil.Err(
			err,
			"failed to create client credentials pair in Ory IdP",
		)
	}

	return &ClientCredentials{
		Issuer:       d.getIssuerUrl(),
		ClientID:     ptrutil.DerefStr(resp.ClientId),
		ClientSecret: ptrutil.DerefStr(resp.ClientSecret),
	}, nil
}

func (d *OryIdp) DeleteClientCredentialsPair(
	ctx context.Context,
	clientCredentials *ClientCredentials,
) error {
	if clientCredentials == nil || clientCredentials.Issuer == "" {
		return fmt.Errorf("client credentials are not provided or issuer is empty")
	}

	body, err := d.getClient().
		OAuth2API.DeleteOAuth2Client(
		context.WithValue(
			ctx,
			orysdk.ContextAccessToken,
			d.settings.ApiKey,
		),
		clientCredentials.ClientID,
	).
		Execute() //nolint:bodyclose // the response body is closed in oryParseAPIResponse

	err = d.oryParseAPIResponse(err, body)
	if err != nil {
		return errutil.Err(
			err,
			"failed to delete client credentials pair in Ory IdP",
		)
	}

	return nil
}

func (d *OryIdp) getClient() *orysdk.APIClient {
	configuration := orysdk.NewConfiguration()
	configuration.Servers = []orysdk.ServerConfiguration{
		{
			URL: d.getIssuerUrl(),
		},
	}

	return orysdk.NewAPIClient(configuration)
}

func (d *OryIdp) oryParseAPIResponse(err error, response *http.Response) error {
	// Ensure the response body is closed after use to prevent resource leaks.
	defer func() {
		if response != nil {
			_ = response.Body.Close()
		}
	}()

	if response == nil || response.Body == nil || err != nil {
		return errutil.Err(
			err, "empty response from Ory API",
		)
	}

	data, bodyErr := io.ReadAll(response.Body)
	if bodyErr != nil {
		return errutil.Err(
			nil, "empty response body from Ory API",
		)
	}

	if err != nil ||
		(response.StatusCode != http.StatusOK && response.StatusCode != http.StatusCreated && response.StatusCode != http.StatusNoContent) {
		return errutil.Err(
			nil,
			fmt.Sprintf("ory API call failed: %s, status code: %d",
				string(data), response.StatusCode),
		)
	}

	return nil
}

func (d *OryIdp) getIssuerUrl() string {
	return fmt.Sprintf("https://%s.projects.oryapis.com", d.settings.ProjectSlug)
}
