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
	passwordLifetime    = 365 * 24 * time.Hour
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
	log.FromContext(ctx).Debug("Creating client credentials pair for Entra ID using static settings (Graph scope)")

	if err := e.validateSettings(); err != nil {
		return nil, err
	}

	issuer := fmt.Sprintf("https://login.microsoftonline.com/%s/v2.0", e.settings.TenantID)

	log.FromContext(ctx).
		WithField("client_id", e.settings.ClientID).
		WithField("issuer", issuer).
		WithField("scopes_count", len([]string{graphScope})).
		Debug("Entra client credentials prepared from settings")

	return &ClientCredentials{
		ClientID:     e.settings.ClientID,
		ClientSecret: e.settings.ClientSecret,
		Issuer:       issuer,
		Scopes:       []string{graphScope},
	}, nil
}

func (e *EntraIdp) DeleteClientCredentialsPair(ctx context.Context, clientCredentials *ClientCredentials) error {
	// When using static client credentials from settings, there is nothing
	// to clean up in Entra. Keep this a no-op to avoid accidentally
	// deleting a manually managed application registration.
	log.FromContext(ctx).Debug("DeleteClientCredentialsPair is a no-op for Entra ID static credentials")
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

func (e *EntraIdp) createApplication(ctx context.Context, client *msgraphsdkgo.GraphServiceClient) (models.Applicationable, error) {
	displayName := getName()
	signInAudience := "AzureADMyOrg"
	requestedAccessTokenVersion := int32(2)

	app := models.NewApplication()
	app.SetDisplayName(&displayName)
	app.SetSignInAudience(&signInAudience)

	apiConfig := models.NewApiApplication()
	apiConfig.SetRequestedAccessTokenVersion(&requestedAccessTokenVersion)
	app.SetApi(apiConfig)

	log.FromContext(ctx).
		WithField("requested_access_token_version", requestedAccessTokenVersion).
		WithField("display_name", displayName).
		Debug("Creating Entra application with v2.0 token version")

	createdApp, err := client.Applications().Post(ctx, app, nil)
	if err != nil {
		return nil, fmt.Errorf("graph applications post failed: %w", err)
	}

	if createdApp == nil || createdApp.GetId() == nil || createdApp.GetAppId() == nil {
		return nil, errors.New("application response is missing identifiers")
	}

	// Update Application ID URI with the actual appId (needed for app-scoped tokens)
	appID := *createdApp.GetAppId()
	objectID := *createdApp.GetId()

	updateApp := models.NewApplication()
	updateApp.SetIdentifierUris([]string{fmt.Sprintf("api://%s", appID)})

	updatedApp, err := client.Applications().ByApplicationId(objectID).Patch(ctx, updateApp, nil)
	if err != nil {
		log.FromContext(ctx).WithError(err).Warn("Failed to set Application ID URI, continuing anyway")
		return createdApp, nil
	}

	return updatedApp, nil
}

func (e *EntraIdp) addPasswordCredential(ctx context.Context, client *msgraphsdkgo.GraphServiceClient, applicationID string) (string, error) {
	if applicationID == "" {
		return "", errors.New("application object ID is empty")
	}

	now := time.Now().UTC()
	end := now.Add(passwordLifetime)

	passwordCredential := models.NewPasswordCredential()
	displayName := passwordDisplayName
	passwordCredential.SetDisplayName(&displayName)
	passwordCredential.SetStartDateTime(&now)
	passwordCredential.SetEndDateTime(&end)

	requestBody := applications.NewItemAddPasswordPostRequestBody()
	requestBody.SetPasswordCredential(passwordCredential)

	// Keep retry window within extended gRPC deadline (30s) to handle Microsoft Entra replication lag
	const (
		maxAttempts = 8
		delay       = 3 * time.Second
	)

	var lastErr error

	for attempt := 0; attempt < maxAttempts; attempt++ {
		if attempt > 0 {
			select {
			case <-ctx.Done():
				return "", ctx.Err()
			case <-time.After(delay):
			}
		}

		response, err := client.Applications().ByApplicationId(applicationID).AddPassword().Post(ctx, requestBody, nil)
		if err == nil {
			if response == nil || response.GetSecretText() == nil || *response.GetSecretText() == "" {
				return "", errors.New("password response did not include secret text")
			}

			secretText := *response.GetSecretText()
			log.FromContext(ctx).
				WithField("attempt", attempt+1).
				WithField("application_id", applicationID).
				WithField("secret_length", len(secretText)).
				Info("Entra addPassword succeeded")

			return secretText, nil
		}

		lastErr = err

		log.FromContext(ctx).
			WithError(err).
			WithField("attempt", attempt+1).
			WithField("application_id", applicationID).
			Warn("Entra addPassword attempt failed")

		if !isPropagationPendingError(err) {
			return "", fmt.Errorf("graph addPassword post failed: %w", err)
		}
	}

	if lastErr == nil {
		return "", errors.New("password creation failed without error details")
	}

	return "", fmt.Errorf("graph addPassword post failed after %d attempts: %w", maxAttempts, lastErr)
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
