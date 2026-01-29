// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package idp

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/Azure/azure-sdk-for-go/sdk/azidentity"
	"github.com/agntcy/identity-service/internal/core/settings/types"
	"github.com/agntcy/identity-service/internal/pkg/ptrutil"
	"github.com/agntcy/identity-service/pkg/log"
	"github.com/agntcy/identity/pkg/oidc"
	"github.com/avast/retry-go/v5"
	msgraphsdkgo "github.com/microsoftgraph/msgraph-sdk-go"
	"github.com/microsoftgraph/msgraph-sdk-go/models"
	"github.com/microsoftgraph/msgraph-sdk-go/organization"
)

const (
	graphScope      = "https://graph.microsoft.com/.default"
	defaultAudience = "AzureADMyOrg"
)

type EntraIdp struct {
	settings          *types.EntraIdpSettings
	client            *msgraphsdkgo.GraphServiceClient
	oidcAuthenticator oidc.Authenticator
}

func NewEntraIdp(settings *types.EntraIdpSettings) (Idp, error) {
	err := validateSettings(settings)
	if err != nil {
		return nil, fmt.Errorf("microsoft entra settings validation failed: %w", err)
	}

	credential, err := azidentity.NewClientSecretCredential(
		settings.TenantID,
		settings.ClientID,
		settings.ClientSecret,
		nil,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create Azure credential: %w", err)
	}

	client, err := msgraphsdkgo.NewGraphServiceClientWithCredentials(credential, []string{graphScope})
	if err != nil {
		return nil, fmt.Errorf("failed to create Microsoft Graph client: %w", err)
	}

	return &EntraIdp{
		settings: &types.EntraIdpSettings{
			TenantID:     settings.TenantID,
			ClientID:     settings.ClientID,
			ClientSecret: settings.ClientSecret,
		},
		client:            client,
		oidcAuthenticator: oidc.NewAuthenticator(),
	}, nil
}

func validateSettings(settings *types.EntraIdpSettings) error {
	if settings == nil {
		return errors.New("entra id settings are not configured")
	}

	if settings.TenantID == "" {
		return errors.New("tenant ID is required")
	}

	if settings.ClientID == "" {
		return errors.New("client ID is required")
	}

	if settings.ClientSecret == "" {
		return errors.New("client secret is required")
	}

	return nil
}

func (e *EntraIdp) TestSettings(ctx context.Context) error {
	_, err := e.client.Organization().Get(ctx, &organization.OrganizationRequestBuilderGetRequestConfiguration{
		QueryParameters: &organization.OrganizationRequestBuilderGetQueryParameters{Select: []string{"id"}},
	})
	if err != nil {
		return fmt.Errorf("failed to verify Microsoft Entra connectivity: %w", err)
	}

	return nil
}

func (e *EntraIdp) CreateClientCredentialsPair(ctx context.Context) (*ClientCredentials, error) {
	log.FromContext(ctx).Debug("Creating client credentials pair for Entra ID using dynamic app provisioning")

	app, secret, err := e.createApplication(ctx)
	if err != nil {
		return nil, err
	}

	appID := ptrutil.DerefStr(app.GetAppId())

	issuer := fmt.Sprintf("https://login.microsoftonline.com/%s/v2.0", e.settings.TenantID)
	scopes := []string{fmt.Sprintf("api://%s/.default", appID)}

	creds := &ClientCredentials{
		ClientID:     appID,
		ClientSecret: secret,
		Issuer:       issuer,
		Scopes:       scopes,
	}

	// Make sure everything is propagated across the different distributed data centers.
	// The trick is to simply try to generate a token with the newely created credentials.
	//nolint:lll // ignore long line
	// https://learn.microsoft.com/en-us/troubleshoot/entra/entra-id/app-integration/404-not-found-error-manage-objects-microsoft-graph
	err = e.validateClientCredentialsPairCreation(ctx, creds)
	if err != nil {
		return nil, fmt.Errorf("failed to validate client credentials creation: %w", err)
	}

	log.FromContext(ctx).
		WithField("app_id", appID).
		WithField("app_object_id", ptrutil.DerefStr(app.GetId())).
		WithField("issuer", issuer).
		WithField("scopes_count", len(scopes)).
		Debug("Entra client credentials created via dynamic app provisioning")

	return creds, nil
}

func (e *EntraIdp) DeleteClientCredentialsPair(ctx context.Context, clientCredentials *ClientCredentials) error {
	logger := log.FromContext(ctx)
	logger.Debug("Deleting client credentials pair for Entra ID")

	if clientCredentials == nil || clientCredentials.ClientID == "" {
		return errors.New("client credentials are not provided or client_id is empty")
	}

	// Deleting an application will also delete the service principal associated with it.
	err := e.client.ApplicationsWithAppId(&clientCredentials.ClientID).Delete(ctx, nil)
	if err != nil {
		// Missing resources are treated as successful deletion.
		if !isNotFoundError(err) {
			return fmt.Errorf("failed to delete application: %w", err)
		}

		logger.Infof("Application with client ID %s does not exist", clientCredentials.ClientID)
	}

	return nil
}

func isNotFoundError(err error) bool {
	if err == nil {
		return false
	}

	msg := err.Error()

	if strings.Contains(msg, "does not exist") || strings.Contains(msg, "Request_ResourceNotFound") {
		return true
	}

	return false
}

func (e *EntraIdp) createApplication(ctx context.Context) (models.Applicationable, string, error) {
	app := models.NewApplication()
	app.SetDisplayName(ptrutil.Ptr(getName()))
	app.SetSignInAudience(ptrutil.Ptr(defaultAudience))

	apiConfig := models.NewApiApplication()
	apiConfig.SetRequestedAccessTokenVersion(ptrutil.Ptr(int32(2))) //nolint:mnd // not a magic number
	app.SetApi(apiConfig)

	// Configure an initial password credential so that the application is
	// immediately usable with client-credentials flow and the secret is
	// returned in the create response (secretText).
	passwordCredential := models.NewPasswordCredential()
	passwordCredential.SetDisplayName(ptrutil.Ptr("identity-service"))
	app.SetPasswordCredentials([]models.PasswordCredentialable{passwordCredential})

	log.FromContext(ctx).
		WithField("name", app.GetDisplayName()).
		Debug("Creating Entra application with v2.0 token version")

	createdApp, err := e.client.Applications().Post(ctx, app, nil)
	if err != nil {
		return nil, "", fmt.Errorf("unable to create Microsoft Entra application: %w", err)
	}

	if createdApp == nil ||
		createdApp.GetId() == nil ||
		createdApp.GetAppId() == nil {
		return nil, "", errors.New("invalid Microsoft Entra application")
	}

	appID := ptrutil.DerefStr(createdApp.GetAppId())
	objectID := ptrutil.DerefStr(createdApp.GetId())

	// Extract the generated secret from the password credentials.
	creds := createdApp.GetPasswordCredentials()
	if len(creds) == 0 ||
		creds[0] == nil ||
		ptrutil.DerefStr(creds[0].GetSecretText()) == "" {
		return nil, "", fmt.Errorf(
			"invalid created password credentials for Microsoft Entra application %s",
			appID,
		)
	}

	// Create a service principal for this application
	// so that client-credentials flow can succeed
	// without relying on implicit provisioning.
	err = e.createServicePrincipal(ctx, appID)
	if err != nil {
		return nil, "", err
	}

	err = e.setIdentifierUriForApplication(ctx, appID, objectID)
	if err != nil {
		return nil, "", err
	}

	return createdApp, ptrutil.DerefStr(creds[0].GetSecretText()), nil
}

// setIdentifierUriForApplication sets an identifier URI
// for an existing Entra application by running an update operation
func (e *EntraIdp) setIdentifierUriForApplication(
	ctx context.Context,
	appID, objectID string,
) error {
	app := models.NewApplication()
	app.SetIdentifierUris([]string{fmt.Sprintf("api://%s", appID)})

	err := e.executeWithRetry(
		ctx,
		func() error {
			_, err := e.client.Applications().ByApplicationId(objectID).Patch(ctx, app, nil)
			return err
		},
		ptrutil.Ptr(fmt.Sprintf("Retry setting an identifier URI for appID %s", appID)),
	)
	if err != nil {
		return fmt.Errorf("failed to set Application Identifier URI: %w", err)
	}

	return nil
}

// createServicePrincipal guarantees that a service principal exists for the
// given appID. This is required for the client-credentials flow to work,
// otherwise Entra returns AADSTS7000229 (missing service principal) or
// related invalid_client errors.
func (e *EntraIdp) createServicePrincipal(
	ctx context.Context,
	appID string,
) error {
	if appID == "" {
		return errors.New("appID is empty when ensuring service principal")
	}

	sp := models.NewServicePrincipal()
	sp.SetAppId(&appID)

	err := e.executeWithRetry(
		ctx,
		func() error {
			createdSp, err := e.client.ServicePrincipals().Post(ctx, sp, nil)
			if err != nil {
				return err
			}

			if createdSp == nil {
				return fmt.Errorf(
					"failed to create service principal for Entra application %s, the returned object is nil",
					appID,
				)
			}

			log.FromContext(ctx).
				Debugf(
					"Service principal %s created for Entra application %s",
					ptrutil.DerefStr(createdSp.GetId()),
					appID,
				)

			return nil
		},
		ptrutil.Ptr(fmt.Sprintf("Retry creating a service principal for appID %s", appID)),
	)
	if err != nil {
		return fmt.Errorf("failed to create service principal: %w", err)
	}

	return nil
}

func (e *EntraIdp) executeWithRetry(
	ctx context.Context,
	retryableFunc retry.RetryableFunc,
	retryLogMsg *string,
) error {
	return retry.New(
		retry.Attempts(10), //nolint:mnd // not a magic number
		retry.Delay(1*time.Second),
		retry.DelayType(retry.BackOffDelay),
		retry.Context(ctx),
		retry.OnRetry(func(attempt uint, err error) {
			if retryLogMsg != nil {
				log.FromContext(ctx).
					WithField("attempt", attempt).
					Debug(ptrutil.DerefStr(retryLogMsg))
			}
		}),
	).Do(retryableFunc)
}

func (e *EntraIdp) validateClientCredentialsPairCreation(ctx context.Context, creds *ClientCredentials) error {
	err := retry.New(
		retry.Attempts(8),          //nolint:mnd // not a magic number
		retry.Delay(2*time.Second), //nolint:mnd // not a magic number
		retry.DelayType(retry.BackOffDelay),
		retry.Context(ctx),
		retry.OnRetry(func(attempt uint, err error) {
			log.FromContext(ctx).
				WithField("attempt", attempt).
				Debugf("Re-try generating proof for issuer %s", creds.Issuer)
		}),
	).Do(func() error {
		_, err := e.oidcAuthenticator.Token(
			ctx,
			creds.Issuer,
			creds.ClientID,
			creds.ClientSecret,
			oidc.WithScopes(creds.Scopes),
		)

		return err
	})

	return err
}
