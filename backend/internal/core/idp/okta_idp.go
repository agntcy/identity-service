// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package idp

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	oktasdk "github.com/okta/okta-sdk-golang/v5/okta"
	"github.com/outshift/identity-service/internal/core/settings/types"
	"github.com/outshift/identity-service/internal/pkg/ptrutil"
	"github.com/outshift/identity-service/internal/pkg/strutil"
	"github.com/outshift/identity-service/pkg/log"
)

const (
	oktaScopes             = "okta.apps.read,okta.apps.manage"
	oktaTimeout            = 10 // seconds
	oktaAuthorization      = "PrivateKey"
	oktaPrivateKeyLineSize = 64 // Number of characters per line in the private key
	oktaMinKeyLines        = 2  // Minimum number of lines for a valid private key (header and footer)
	oktaSignInMode         = "OPENID_CONNECT"
	oktaResponseType       = "token"
	oktaGrantType          = "client_credentials"
	oktaApplicationName    = "oidc_client"
	oktaApplicationType    = "service"
)

type OktaIdp struct {
	settings *types.OktaIdpSettings
	api      *oktasdk.APIClient
}

func NewOktaIdp(settings *types.OktaIdpSettings) Idp {
	return &OktaIdp{settings: settings}
}

func (d *OktaIdp) TestSettings(ctx context.Context) error {
	if d.settings == nil {
		return errors.New("okta idp settings are not configured")
	}

	// Attempt to create a new Okta API client configuration
	config, err := oktasdk.NewConfiguration(
		oktasdk.WithAuthorizationMode(oktaAuthorization),
		oktasdk.WithOrgUrl(d.settings.OrgUrl),
		oktasdk.WithClientId(d.settings.ClientID),
		oktasdk.WithScopes(strings.Split(oktaScopes, ",")),
		oktasdk.WithPrivateKey(d.getPrivateKey()),
		oktasdk.WithRequestTimeout(oktaTimeout),
	)
	if err != nil {
		return fmt.Errorf("failed to create Okta API client: %w", err)
	}

	// Create a new Okta API client with the provided configuration
	d.api = oktasdk.NewAPIClient(config)

	// Test the connection by making a simple API call
	_, body, err := d.api.ApplicationAPI.ListApplications(ctx).Execute()

	err = d.oktaParseAPIResponse(err, body)
	if err != nil {
		return fmt.Errorf("failed to connect to Okta IdP: %w", err)
	}

	return err
}

func (d *OktaIdp) CreateClientCredentialsPair(
	ctx context.Context,
) (*ClientCredentials, error) {
	log.FromContext(ctx).Debug("Creating client credentials pair for Okta IdP")

	application, body, err := d.api.ApplicationAPI.CreateApplication(ctx).
		Application(oktasdk.ListApplications200ResponseInner{
			OpenIdConnectApplication: &oktasdk.OpenIdConnectApplication{
				Application: oktasdk.Application{
					Label:      getName(),
					SignOnMode: oktaSignInMode,
				},
				Name: oktaApplicationName,
				Settings: oktasdk.OpenIdConnectApplicationSettings{
					OauthClient: &oktasdk.OpenIdConnectApplicationSettingsClient{
						ApplicationType: ptrutil.Ptr(oktaApplicationType),
						GrantTypes:      []string{oktaGrantType},
						ResponseTypes:   []string{oktaResponseType},
						RedirectUris:    []string{},
					},
				},
			},
		}).Activate(true).
		Execute()

	err = d.oktaParseAPIResponse(err, body)
	if err != nil {
		return nil, fmt.Errorf("failed to create Okta application: %w", err)
	}

	if application.OpenIdConnectApplication == nil ||
		application.OpenIdConnectApplication.GetCredentials().OauthClient == nil {
		return nil, errors.New(
			"failed to create Okta application: OpenIdConnectApplication or credentials are nil",
		)
	}

	return &ClientCredentials{
		ClientID:     *application.OpenIdConnectApplication.GetCredentials().OauthClient.ClientId,
		Issuer:       fmt.Sprintf("%s/oauth2/default", d.settings.OrgUrl),
		ClientSecret: *application.OpenIdConnectApplication.GetCredentials().OauthClient.ClientSecret,
	}, nil
}

func (d *OktaIdp) DeleteClientCredentialsPair(
	ctx context.Context,
	clientCredentials *ClientCredentials,
) error {
	if clientCredentials == nil || clientCredentials.Issuer == "" {
		return fmt.Errorf("client credentials are not provided or issuer is empty")
	}

	_, err := d.api.ApplicationAPI.DeleteApplication(ctx, clientCredentials.ClientID).Execute()
	if err != nil {
		return fmt.Errorf(
			"failed to delete client credentials pair for issuer %s: %w",
			clientCredentials.Issuer,
			err,
		)
	}

	return nil
}

func (d *OktaIdp) getPrivateKey() string {
	if d.settings == nil || d.settings.PrivateKey == "" {
		return ""
	}

	// Create api key
	rawKey := strutil.TrimSpaceAndNewline(d.settings.PrivateKey)
	size := len(rawKey) / oktaPrivateKeyLineSize

	if size < oktaMinKeyLines {
		return ""
	}

	privateKey := "-----BEGIN PRIVATE KEY-----\n"
	for index := range size - 1 {
		privateKey += rawKey[index*oktaPrivateKeyLineSize:(index+1)*oktaPrivateKeyLineSize] + "\n"
	}

	privateKey += rawKey[(size-1)*oktaPrivateKeyLineSize:] + "\n-----END PRIVATE KEY-----"

	return privateKey
}

func (d *OktaIdp) oktaParseAPIResponse(err error, response *oktasdk.APIResponse) error {
	// Ensure the response body is closed after use to prevent resource leaks.
	defer func() {
		if response != nil {
			_ = response.Body.Close()
		}
	}()

	if response == nil || response.Body == nil || err != nil {
		return fmt.Errorf("empty response from Okta API: %w", err)
	}

	data, bodyErr := io.ReadAll(response.Body)
	if bodyErr != nil {
		return errors.New("empty response body from Okta API")
	}

	if response.StatusCode != http.StatusOK {
		return fmt.Errorf(
			"okta API call failed: %s, status code: %d",
			string(data), response.StatusCode,
		)
	}

	return nil
}
