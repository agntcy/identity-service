// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package idp

import (
	"context"
	"fmt"
	"strings"

	"github.com/agntcy/identity-platform/internal/core/settings/types"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/pkg/log"
	oktasdk "github.com/okta/okta-sdk-golang/v5/okta"
)

const (
	oktaScopes             = "okta.apps.read,okta.apps.manage"
	oktaTimeout            = 10 // seconds
	oktaAuthorization      = "PrivateKey"
	oktaPrivateKeyLineSize = 64 // Number of characters per line in the private key
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
		oktasdk.WithOrgUrl(d.IdpSettings.OrgUrl),
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

	// Test the connection by making a simple API call
	_, _, applicationErr := d.api.ApplicationAPI.ListApplications(ctx).Execute()
	if applicationErr != nil {
		return errutil.Err(
			applicationErr,
			"failed to connect to Okta IdP",
		)
	}

	return err
}

func (d *OktaIdp) CreateClientCredentialsPair(
	ctx context.Context,
) (*ClientCredentials, error) {
	log.Debug("Creating client credentials pair for Okta IdP")

	application, _, err := d.api.ApplicationAPI.CreateApplication(ctx).Execute()

	log.Debug("Created Okta application with ID:", application)

	return nil, errutil.Err(
		err,
		"failed to create Okta application",
	)

	// var integrationData integration
	// if err := json.Unmarshal(data, &integrationData); err != nil {
	// 	return nil, errutil.Err(
	// 		err,
	// 		"failed to unmarshal Okta IdP integration data",
	// 	)
	// }
	//
	// return &ClientCredentials{
	// 	ClientID:     integrationData.Response.Sso.OauthConfig.Clients[0].ClientId,
	// 	ClientSecret: integrationData.Response.Sso.OauthConfig.Clients[0].ClientSecret,
	// 	Issuer:       integrationData.Response.Sso.IdpMetadata.Issuer,
	// }, nil
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
		return errutil.Err(
			err,
			"failed to delete client credentials pair for issuer %s",
		)
	}

	return nil
}

func (d *OktaIdp) getPrivateKey() string {
	if d.IdpSettings == nil || d.IdpSettings.PrivateKey == "" {
		return ""
	}

	// Create api key
	rawKey := d.IdpSettings.PrivateKey
	size := len(rawKey) / oktaPrivateKeyLineSize

	if size < oktaPrivateKeyLineSize {
		return ""
	}

	privateKey := "-----BEGIN PRIVATE KEY-----\n"
	for index := range size {
		privateKey += rawKey[index*oktaPrivateKeyLineSize:(index+1)*oktaPrivateKeyLineSize] + "\n"
	}

	privateKey += rawKey[(size-1)*oktaPrivateKeyLineSize:] + "\n-----END PRIVATE KEY-----"

	return privateKey
}
