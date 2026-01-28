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
	"github.com/agntcy/identity-service/pkg/log"
	msgraphsdkgo "github.com/microsoftgraph/msgraph-sdk-go"
	"github.com/microsoftgraph/msgraph-sdk-go/applications"
	"github.com/microsoftgraph/msgraph-sdk-go/models"
	"github.com/microsoftgraph/msgraph-sdk-go/organization"
	"github.com/microsoftgraph/msgraph-sdk-go/serviceprincipals"
)

const (
	graphScope          = "https://graph.microsoft.com/.default"
	passwordDisplayName = "identity-service"
)

type EntraIdp struct {
	settings *types.EntraIdpSettings
}

func NewEntraIdp(settings *types.EntraIdpSettings) Idp {
	return &EntraIdp{
		settings: &types.EntraIdpSettings{
			TenantID:     settings.TenantID,
			ClientID:     settings.ClientID,
			ClientSecret: settings.ClientSecret,
		},
	}
}

func (e *EntraIdp) TestSettings(ctx context.Context) error {
	if err := e.validateSettings(); err != nil {
		return err
	}

	client, err := e.graphClient()
	if err != nil {
		return fmt.Errorf("failed to initialize Microsoft Graph client: %w", err)
	}

	_, err = client.Organization().Get(ctx, &organization.OrganizationRequestBuilderGetRequestConfiguration{
		QueryParameters: &organization.OrganizationRequestBuilderGetQueryParameters{Select: []string{"id"}},
	})
	if err != nil {
		return fmt.Errorf("failed to verify Microsoft Entra connectivity: %w", err)
	}

	return nil
}

func (e *EntraIdp) CreateClientCredentialsPair(ctx context.Context) (*ClientCredentials, error) {
	logger := log.FromContext(ctx)
	logger.Debug("Creating client credentials pair for Entra ID using dynamic app provisioning")

	if err := e.validateSettings(); err != nil {
		return nil, err
	}

	client, err := e.graphClient()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize Microsoft Graph client: %w", err)
	}

	app, secret, err := e.createApplication(ctx, client)
	if err != nil {
		return nil, fmt.Errorf("failed to create Entra application: %w", err)
	}

	if app == nil || app.GetId() == nil || app.GetAppId() == nil {
		return nil, errors.New("application response is missing identifiers")
	}

	appObjectID := *app.GetId()
	appID := *app.GetAppId()

	issuer := fmt.Sprintf("https://login.microsoftonline.com/%s/v2.0", e.settings.TenantID)
	scopes := []string{fmt.Sprintf("api://%s/.default", appID)}

	logger.
		WithField("app_id", appID).
		WithField("app_object_id", appObjectID).
		WithField("issuer", issuer).
		WithField("scopes_count", len(scopes)).
		Info("Entra client credentials created via dynamic app provisioning")

	return &ClientCredentials{
		ClientID:     appID,
		ClientSecret: secret,
		Issuer:       issuer,
		Scopes:       scopes,
	}, nil
}

func (e *EntraIdp) DeleteClientCredentialsPair(ctx context.Context, clientCredentials *ClientCredentials) error {
	logger := log.FromContext(ctx)
	logger.Debug("Deleting client credentials pair for Entra ID")

	if clientCredentials == nil || clientCredentials.ClientID == "" {
		return errors.New("client credentials are not provided or client_id is empty")
	}

	if err := e.validateSettings(); err != nil {
		return err
	}

	client, err := e.graphClient()
	if err != nil {
		return fmt.Errorf("failed to initialize Microsoft Graph client: %w", err)
	}

	// Best-effort delete: application first, then service principal. Missing
	// resources are treated as successful deletion.
	appObjectID, err := e.lookupApplicationObjectID(ctx, client, clientCredentials.ClientID)
	if err != nil {
		return fmt.Errorf("failed to lookup application object ID: %w", err)
	}

	if appObjectID != "" {
		logger.WithField("app_object_id", appObjectID).Debug("Deleting Entra application")
		if err := client.Applications().ByApplicationId(appObjectID).Delete(ctx, nil); err != nil {
			if !isNotFoundError(err) {
				return fmt.Errorf("failed to delete application: %w", err)
			}
			logger.WithError(err).WithField("app_object_id", appObjectID).Debug("Entra application already deleted")
		}
	}

	spObjectID, err := e.lookupServicePrincipalObjectID(ctx, client, clientCredentials.ClientID)
	if err != nil {
		return fmt.Errorf("failed to lookup service principal object ID: %w", err)
	}

	if spObjectID != "" {
		logger.WithField("service_principal_id", spObjectID).Debug("Deleting Entra service principal")
		if err := client.ServicePrincipals().ByServicePrincipalId(spObjectID).Delete(ctx, nil); err != nil {
			if !isNotFoundError(err) {
				return fmt.Errorf("failed to delete service principal: %w", err)
			}
			logger.WithError(err).WithField("service_principal_id", spObjectID).Debug("Entra service principal already deleted")
		}
	}

	return nil
}

func (e *EntraIdp) validateSettings() error {
	if e.settings == nil {
		return errors.New("entra id settings are not configured")
	}

	if e.settings.TenantID == "" || e.settings.ClientID == "" || e.settings.ClientSecret == "" {
		return errors.New("tenant ID, client ID, and client secret are required for Entra ID")
	}

	return nil
}

func (e *EntraIdp) graphClient() (*msgraphsdkgo.GraphServiceClient, error) {
	credential, err := azidentity.NewClientSecretCredential(
		e.settings.TenantID,
		e.settings.ClientID,
		e.settings.ClientSecret,
		nil,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create Azure credential: %w", err)
	}

	client, err := msgraphsdkgo.NewGraphServiceClientWithCredentials(credential, []string{graphScope})
	if err != nil {
		return nil, fmt.Errorf("failed to create Microsoft Graph client: %w", err)
	}

	return client, nil
}

func (e *EntraIdp) createApplication(ctx context.Context, client *msgraphsdkgo.GraphServiceClient) (models.Applicationable, string, error) {
	displayName := getName()
	signInAudience := "AzureADMyOrg"
	requestedAccessTokenVersion := int32(2)

	app := models.NewApplication()
	app.SetDisplayName(&displayName)
	app.SetSignInAudience(&signInAudience)

	apiConfig := models.NewApiApplication()
	apiConfig.SetRequestedAccessTokenVersion(&requestedAccessTokenVersion)
	app.SetApi(apiConfig)

	// Configure an initial password credential so that the application is
	// immediately usable with client-credentials flow and the secret is
	// returned in the create response (secretText).
	passwordCredential := models.NewPasswordCredential()
	passwordName := passwordDisplayName
	passwordCredential.SetDisplayName(&passwordName)
	passwordCredentials := []models.PasswordCredentialable{passwordCredential}
	app.SetPasswordCredentials(passwordCredentials)

	log.FromContext(ctx).
		WithField("requested_access_token_version", requestedAccessTokenVersion).
		WithField("display_name", displayName).
		Debug("Creating Entra application with v2.0 token version")

	createdApp, err := client.Applications().Post(ctx, app, nil)
	if err != nil {
		return nil, "", fmt.Errorf("graph applications post failed: %w", err)
	}

	if createdApp == nil || createdApp.GetId() == nil || createdApp.GetAppId() == nil {
		return nil, "", errors.New("application response is missing identifiers")
	}

	// Extract the generated secret from the password credentials.
	creds := createdApp.GetPasswordCredentials()
	if len(creds) == 0 || creds[0] == nil || creds[0].GetSecretText() == nil || *creds[0].GetSecretText() == "" {
		return nil, "", errors.New("application response did not include password secret")
	}

	// Update Application ID URI with the actual appId (needed for app-scoped tokens).
	appID := *createdApp.GetAppId()
	objectID := *createdApp.GetId()

	updateApp := models.NewApplication()
	updateApp.SetIdentifierUris([]string{fmt.Sprintf("api://%s", appID)})

	const (
		maxAttempts = 8
		delay       = 3 * time.Second
	)

	var lastErr error

	for attempt := 0; attempt < maxAttempts; attempt++ {
		if attempt > 0 {
			select {
			case <-ctx.Done():
				return nil, "", ctx.Err()
			case <-time.After(delay):
			}
		}

		updatedApp, err := client.Applications().ByApplicationId(objectID).Patch(ctx, updateApp, nil)
		if err == nil {
			log.FromContext(ctx).
				WithField("application_id", objectID).
				WithField("app_id_uri", fmt.Sprintf("api://%s", appID)).
				WithField("attempt", attempt+1).
				Info("Entra Application ID URI set successfully")

			// Ensure a corresponding service principal exists for this
			// application so that client-credentials flow can succeed
			// without relying on implicit provisioning.
			if err := e.ensureServicePrincipal(ctx, client, appID); err != nil {
				return nil, "", fmt.Errorf("failed to ensure service principal: %w", err)
			}

			// Return the originally created application object, which is
			// guaranteed to have both Id and AppId populated.
			_ = updatedApp // updatedApp is not used beyond confirming success.
			return createdApp, *creds[0].GetSecretText(), nil
		}

		lastErr = err

		log.FromContext(ctx).
			WithError(err).
			WithField("application_id", objectID).
			WithField("attempt", attempt+1).
			Warn("Failed to set Application ID URI, retrying if propagation pending")

		if !isPropagationPendingError(err) {
			break
		}
	}

	if lastErr != nil {
		return nil, "", fmt.Errorf("failed to set Application ID URI after %d attempts: %w", maxAttempts, lastErr)
	}

	return createdApp, *creds[0].GetSecretText(), nil
}

func isPropagationPendingError(err error) bool {
	if err == nil {
		return false
	}

	msg := err.Error()

	switch {
	case strings.Contains(msg, "does not reference a valid application object"):
		return true
	case strings.Contains(msg, "Resource") && strings.Contains(msg, "does not exist"):
		return true
	case strings.Contains(msg, "Request_ResourceNotFound"):
		return true
	default:
		return false
	}
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

// ensureServicePrincipal guarantees that a service principal exists for the
// given appID. This is required for the client-credentials flow to work,
// otherwise Entra returns AADSTS7000229 (missing service principal) or
// related invalid_client errors.
func (e *EntraIdp) ensureServicePrincipal(
	ctx context.Context,
	client *msgraphsdkgo.GraphServiceClient,
	appID string,
) error {
	logger := log.FromContext(ctx)

	if appID == "" {
		return errors.New("appID is empty when ensuring service principal")
	}

	// If a service principal already exists, nothing to do.
	if existingID, err := e.lookupServicePrincipalObjectID(ctx, client, appID); err != nil {
		return fmt.Errorf("failed to lookup existing service principal: %w", err)
	} else if existingID != "" {
		logger.WithField("service_principal_id", existingID).Debug("Service principal already exists for application")
		return nil
	}

	sp := models.NewServicePrincipal()
	sp.SetAppId(&appID)

	const (
		maxAttempts = 8
		delay       = 3 * time.Second
	)

	var lastErr error

	for attempt := 0; attempt < maxAttempts; attempt++ {
		if attempt > 0 {
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(delay):
			}
		}

		createdSp, err := client.ServicePrincipals().Post(ctx, sp, nil)
		if err == nil {
			id := ""
			if createdSp != nil && createdSp.GetId() != nil {
				id = *createdSp.GetId()
			}

			logger.
				WithField("service_principal_id", id).
				WithField("app_id", appID).
				WithField("attempt", attempt+1).
				Info("Service principal created for Entra application")
			return nil
		}

		lastErr = err

		logger.
			WithError(err).
			WithField("app_id", appID).
			WithField("attempt", attempt+1).
			Warn("Failed to create service principal, retrying if propagation pending")

		if !isPropagationPendingError(err) {
			break
		}
	}

	if lastErr != nil {
		return fmt.Errorf("failed to create service principal after %d attempts: %w", maxAttempts, lastErr)
	}

	return nil
}

func (e *EntraIdp) lookupApplicationObjectID(ctx context.Context, client *msgraphsdkgo.GraphServiceClient, clientID string) (string, error) {
	if clientID == "" {
		return "", nil
	}

	filter := fmt.Sprintf("appId eq '%s'", clientID)
	top := int32(1)

	response, err := client.Applications().Get(ctx, &applications.ApplicationsRequestBuilderGetRequestConfiguration{
		QueryParameters: &applications.ApplicationsRequestBuilderGetQueryParameters{
			Filter: &filter,
			Top:    &top,
			Select: []string{"id"},
		},
	})
	if err != nil {
		return "", fmt.Errorf("graph applications get failed: %w", err)
	}

	if response == nil || response.GetValue() == nil || len(response.GetValue()) == 0 {
		return "", nil
	}

	id := response.GetValue()[0].GetId()
	if id == nil {
		return "", nil
	}

	return *id, nil
}

func (e *EntraIdp) lookupServicePrincipalObjectID(ctx context.Context, client *msgraphsdkgo.GraphServiceClient, clientID string) (string, error) {
	if clientID == "" {
		return "", nil
	}

	filter := fmt.Sprintf("appId eq '%s'", clientID)
	top := int32(1)

	response, err := client.ServicePrincipals().Get(ctx, &serviceprincipals.ServicePrincipalsRequestBuilderGetRequestConfiguration{
		QueryParameters: &serviceprincipals.ServicePrincipalsRequestBuilderGetQueryParameters{
			Filter: &filter,
			Top:    &top,
			Select: []string{"id"},
		},
	})
	if err != nil {
		return "", fmt.Errorf("graph servicePrincipals get failed: %w", err)
	}

	if response == nil || response.GetValue() == nil || len(response.GetValue()) == 0 {
		return "", nil
	}

	id := response.GetValue()[0].GetId()
	if id == nil {
		return "", nil
	}

	return *id, nil
}
