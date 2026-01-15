// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package idp

import (
	"context"
	"errors"
	"fmt"
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
	log.FromContext(ctx).Debug("Creating client credentials pair for Entra ID")

	if err := e.validateSettings(); err != nil {
		return nil, err
	}

	client, err := e.graphClient()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize Microsoft Graph client: %w", err)
	}

	app, err := e.createApplication(ctx, client)
	if err != nil {
		return nil, fmt.Errorf("failed to create application: %w", err)
	}

	appID := app.GetAppId()
	if appID == nil || *appID == "" {
		return nil, errors.New("application response is missing appId")
	}

	objectID := app.GetId()
	if objectID == nil || *objectID == "" {
		return nil, errors.New("application response is missing object id")
	}

	log.FromContext(ctx).Debugf("Created application with AppId: %s, ObjectId: %s", *appID, *objectID)

	if _, err := e.createServicePrincipal(ctx, client, *appID); err != nil {
		return nil, fmt.Errorf("failed to create service principal: %w", err)
	}

	// Add a small delay to ensure the application is fully provisioned in Microsoft Entra ID
	// This helps prevent replication lag issues in Microsoft's distributed system
	time.Sleep(2 * time.Second)

	secret, err := e.addPasswordCredential(ctx, client, *objectID)
	if err != nil {
		return nil, fmt.Errorf("failed to add password credential: %w", err)
	}

	return &ClientCredentials{
		ClientID:     *appID,
		ClientSecret: secret,
		Issuer:       fmt.Sprintf("https://login.microsoftonline.com/%s/v2.0", e.settings.TenantID),
	}, nil
}

func (e *EntraIdp) DeleteClientCredentialsPair(ctx context.Context, clientCredentials *ClientCredentials) error {
	log.FromContext(ctx).Debug("Deleting client credentials pair for Entra ID")

	if err := e.validateSettings(); err != nil {
		return err
	}

	client, err := e.graphClient()
	if err != nil {
		return fmt.Errorf("failed to initialize Microsoft Graph client: %w", err)
	}

	if clientCredentials == nil || clientCredentials.ClientID == "" {
		return errors.New("client credentials are not provided or client ID is empty")
	}

	appID, err := e.lookupApplicationObjectID(ctx, client, clientCredentials.ClientID)
	if err != nil {
		return fmt.Errorf("failed to locate application: %w", err)
	}

	spID, err := e.lookupServicePrincipalObjectID(ctx, client, clientCredentials.ClientID)
	if err != nil {
		return fmt.Errorf("failed to locate service principal: %w", err)
	}

	if appID != "" {
		if err := client.Applications().ByApplicationId(appID).Delete(ctx, nil); err != nil {
			return fmt.Errorf("failed to delete application: %w", err)
		}
	}

	if spID != "" {
		if err := client.ServicePrincipals().ByServicePrincipalId(spID).Delete(ctx, nil); err != nil {
			return fmt.Errorf("failed to delete service principal: %w", err)
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

	createdApp, err := client.Applications().Post(ctx, app, nil)
	if err != nil {
		return nil, fmt.Errorf("graph applications post failed: %w", err)
	}

	if createdApp == nil || createdApp.GetId() == nil || createdApp.GetAppId() == nil {
		return nil, errors.New("application response is missing identifiers")
	}

	return createdApp, nil
}

func (e *EntraIdp) createServicePrincipal(ctx context.Context, client *msgraphsdkgo.GraphServiceClient, appID string) (models.ServicePrincipalable, error) {
	if appID == "" {
		return nil, errors.New("application ID is empty")
	}

	sp := models.NewServicePrincipal()
	sp.SetAppId(&appID)

	createdSP, err := client.ServicePrincipals().Post(ctx, sp, nil)
	if err != nil {
		return nil, fmt.Errorf("graph servicePrincipals post failed: %w", err)
	}

	if createdSP == nil || createdSP.GetId() == nil {
		return nil, errors.New("service principal response is missing identifier")
	}

	return createdSP, nil
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

	// Retry mechanism for Microsoft Entra ID replication delays
	var response models.PasswordCredentialable
	var err error
	maxRetries := 5
	retryDelay := 2 * time.Second

	for attempt := 0; attempt < maxRetries; attempt++ {
		if attempt > 0 {
			log.FromContext(ctx).Debugf("Retrying addPassword (attempt %d/%d) after %v", attempt+1, maxRetries, retryDelay)
			time.Sleep(retryDelay)
		}

		response, err = client.Applications().ByApplicationId(applicationID).AddPassword().Post(ctx, requestBody, nil)
		if err == nil {
			break
		}

		// If this is the last attempt, return the error
		if attempt == maxRetries-1 {
			return "", fmt.Errorf("graph addPassword post failed after %d attempts: %w", maxRetries, err)
		}
	}

	if response == nil || response.GetSecretText() == nil || *response.GetSecretText() == "" {
		return "", errors.New("password response did not include secret text")
	}

	return *response.GetSecretText(), nil
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
