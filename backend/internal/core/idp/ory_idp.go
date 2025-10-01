// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package idp

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"

	"github.com/agntcy/identity-service/internal/core/settings/types"
	"github.com/agntcy/identity-service/internal/pkg/ptrutil"
	"github.com/agntcy/identity-service/pkg/log"
	orysdk "github.com/ory/client-go"
)

const (
	oryClientName             = "ory-client"
	oryClientCredentials      = "client_credentials"
	oryToken                  = "token"
	oryJwtAccessTokenStrategy = "jwt"
)

type OryIdp struct {
	settings *types.OryIdpSettings
}

func NewOryIdp(settings *types.OryIdpSettings) Idp {
	return &OryIdp{
		settings: settings,
	}
}

func (d *OryIdp) TestSettings(ctx context.Context) error {
	if d.settings == nil {
		return errors.New("ory idp settings are not configured")
	}

	_, body, err := d.getClient().
		OAuth2API.ListOAuth2Clients(context.WithValue(ctx, orysdk.ContextAccessToken, d.settings.ApiKey)).
		ClientName(oryClientName).
		Execute() //nolint:bodyclose // the response body is closed in oryParseAPIResponse

	err = d.oryParseAPIResponse(err, body)
	if err != nil {
		return fmt.Errorf("failed to connect to Ory IdP: %w", err)
	}

	return nil
}

func (d *OryIdp) CreateClientCredentialsPair(
	ctx context.Context,
) (*ClientCredentials, error) {
	log.FromContext(ctx).Debug("Creating client credentials pair for Ory IdP")

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
		return nil, fmt.Errorf(
			"failed to create client credentials pair in Ory IdP: %w",
			err,
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
		return fmt.Errorf(
			"failed to delete client credentials pair in Ory IdP: %w",
			err,
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
		return fmt.Errorf("empty response from Ory API: %w", err)
	}

	data, bodyErr := io.ReadAll(response.Body)
	if bodyErr != nil {
		return errors.New("empty response body from Ory API")
	}

	if response.StatusCode != http.StatusOK &&
		response.StatusCode != http.StatusCreated &&
		response.StatusCode != http.StatusNoContent {
		return fmt.Errorf(
			"ory API call failed: %s, status code: %d",
			string(data), response.StatusCode,
		)
	}

	return nil
}

func (d *OryIdp) getIssuerUrl() string {
	return fmt.Sprintf("https://%s.projects.oryapis.com", d.settings.ProjectSlug)
}
