// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Appentifier: Apache-2.0

package bff_test

import (
	"context"
	"errors"
	"testing"

	"github.com/agntcy/identity/pkg/jwk"
	"github.com/google/uuid"
	"github.com/outshift/identity-service/internal/bff"
	appmocks "github.com/outshift/identity-service/internal/core/app/mocks"
	apptypes "github.com/outshift/identity-service/internal/core/app/types"
	badgemocks "github.com/outshift/identity-service/internal/core/badge/mocks"
	iamtypes "github.com/outshift/identity-service/internal/core/iam/types"
	identitycore "github.com/outshift/identity-service/internal/core/identity"
	identitymocks "github.com/outshift/identity-service/internal/core/identity/mocks"
	"github.com/outshift/identity-service/internal/core/idp"
	idpmocks "github.com/outshift/identity-service/internal/core/idp/mocks"
	policymocks "github.com/outshift/identity-service/internal/core/policy/mocks"
	settingsmocks "github.com/outshift/identity-service/internal/core/settings/mocks"
	settingstypes "github.com/outshift/identity-service/internal/core/settings/types"
	identitycontext "github.com/outshift/identity-service/internal/pkg/context"
	iammocks "github.com/outshift/identity-service/internal/pkg/iam/mocks"
	"github.com/outshift/identity-service/internal/pkg/pagination"
	"github.com/outshift/identity-service/internal/pkg/ptrutil"
	"github.com/outshift/identity-service/internal/pkg/sorting"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// CreateApp

func TestAppService_CreateApp_should_succeed(t *testing.T) {
	t.Parallel()

	ctx := identitycontext.InsertUserID(context.Background(), uuid.NewString())
	app := &apptypes.App{
		Type: apptypes.APP_TYPE_AGENT_A2A,
	}
	issuer := &settingstypes.IssuerSettings{
		IssuerID: uuid.NewString(),
		KeyID:    uuid.NewString(),
		IdpType:  settingstypes.IDP_TYPE_SELF,
	}
	resolverMetadataID := uuid.NewString()
	apiKey := &iamtypes.APIKey{}
	settingsRepo := settingsmocks.NewRepository(t)
	settingsRepo.EXPECT().GetIssuerSettings(ctx).Return(issuer, nil)

	idpFactory := idp.NewFactory()
	identityServ := identitymocks.NewService(t)
	identityServ.EXPECT().
		GenerateID(ctx, mock.Anything, &identitycore.Issuer{
			CommonName: issuer.IssuerID,
			KeyID:      issuer.KeyID,
		}).
		Return(resolverMetadataID, nil)

	credStore := idpmocks.NewCredentialStore(t)
	credStore.EXPECT().Put(ctx, mock.Anything, mock.Anything).Return(nil)

	iamClient := iammocks.NewClient(t)
	iamClient.EXPECT().CreateAppAPIKey(ctx, mock.Anything).Return(apiKey, nil)

	appRepo := appmocks.NewRepository(t)
	appRepo.EXPECT().CreateApp(ctx, app).Return(app, nil)
	sut := bff.NewAppService(
		appRepo,
		settingsRepo,
		identityServ,
		idpFactory,
		credStore,
		iamClient,
		nil,
		nil,
		nil,
		nil,
	)

	createdApp, err := sut.CreateApp(ctx, app)

	assert.NoError(t, err)
	assert.NotNil(t, createdApp)
	assert.Equal(t, ptrutil.DerefStr(apiKey.Secret), createdApp.ApiKey)
}

func TestAppService_CreateApp_should_return_err_when_app_is_invalid(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		app    *apptypes.App
		errMsg string
	}{
		"nil app": {
			app:    nil,
			errMsg: "app cannot be nil",
		},
		"invalid app type": {
			app:    &apptypes.App{Type: apptypes.APP_TYPE_UNSPECIFIED},
			errMsg: "app type is required",
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			ctx := context.Background()
			sut := bff.NewAppService(nil, nil, nil, nil, nil, nil, nil, nil, nil, nil)

			_, err := sut.CreateApp(ctx, tc.app)

			assert.Error(t, err)
			assert.ErrorContains(t, err, tc.errMsg)
		})
	}
}

func TestAppService_CreateApp_should_return_err_when_issuer_not_found(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	app := &apptypes.App{
		Type: apptypes.APP_TYPE_AGENT_A2A,
	}
	settingsRepo := settingsmocks.NewRepository(t)
	settingsRepo.EXPECT().GetIssuerSettings(ctx).Return(nil, errors.New("error"))
	sut := bff.NewAppService(nil, settingsRepo, nil, nil, nil, nil, nil, nil, nil, nil)

	_, err := sut.CreateApp(ctx, app)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "unable to fetch settings")
}

func TestAppService_CreateApp_should_return_err_when_idp_type_is_invalid(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	app := &apptypes.App{
		Type: apptypes.APP_TYPE_AGENT_A2A,
	}
	issuer := &settingstypes.IssuerSettings{
		IssuerID: uuid.NewString(),
		KeyID:    uuid.NewString(),
		IdpType:  settingstypes.IDP_TYPE_UNSPECIFIED,
	}
	settingsRepo := settingsmocks.NewRepository(t)
	settingsRepo.EXPECT().GetIssuerSettings(ctx).Return(issuer, nil)

	idpFactory := idp.NewFactory()
	sut := bff.NewAppService(nil, settingsRepo, nil, idpFactory, nil, nil, nil, nil, nil, nil)

	_, err := sut.CreateApp(ctx, app)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed to create IDP instance")
}

func TestAppService_CreateApp_should_return_err_when_client_cred_pair_creation_fails(t *testing.T) {
	t.Parallel()

	invalidCtxWithoutUserID := context.Background()
	app := &apptypes.App{
		Type: apptypes.APP_TYPE_AGENT_A2A,
	}
	issuer := &settingstypes.IssuerSettings{
		IdpType: settingstypes.IDP_TYPE_SELF,
	}
	settingsRepo := settingsmocks.NewRepository(t)
	settingsRepo.EXPECT().GetIssuerSettings(invalidCtxWithoutUserID).Return(issuer, nil)

	idpFactory := idp.NewFactory()
	sut := bff.NewAppService(nil, settingsRepo, nil, idpFactory, nil, nil, nil, nil, nil, nil)

	_, err := sut.CreateApp(invalidCtxWithoutUserID, app)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed to create client credentials pair")
}

func TestAppService_CreateApp_should_return_err_when_id_generation_fails(t *testing.T) {
	t.Parallel()

	ctx := identitycontext.InsertUserID(context.Background(), uuid.NewString())
	app := &apptypes.App{
		Type: apptypes.APP_TYPE_AGENT_A2A,
	}
	issuer := &settingstypes.IssuerSettings{
		IdpType: settingstypes.IDP_TYPE_SELF,
	}
	settingsRepo := settingsmocks.NewRepository(t)
	settingsRepo.EXPECT().GetIssuerSettings(ctx).Return(issuer, nil)

	idpFactory := idp.NewFactory()
	identityServ := identitymocks.NewService(t)
	identityServ.EXPECT().
		GenerateID(ctx, mock.Anything, mock.Anything).
		Return("", errors.New("failed id gen"))
	sut := bff.NewAppService(
		nil,
		settingsRepo,
		identityServ,
		idpFactory,
		nil,
		nil,
		nil,
		nil,
		nil,
		nil,
	)

	_, err := sut.CreateApp(ctx, app)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed id gen")
}

func TestAppService_CreateApp_should_return_err_when_client_cred_cannot_be_stored(t *testing.T) {
	t.Parallel()

	ctx := identitycontext.InsertUserID(context.Background(), uuid.NewString())
	app := &apptypes.App{
		Type: apptypes.APP_TYPE_AGENT_A2A,
	}
	issuer := &settingstypes.IssuerSettings{
		IssuerID: uuid.NewString(),
		KeyID:    uuid.NewString(),
		IdpType:  settingstypes.IDP_TYPE_SELF,
	}
	resolverMetadataID := uuid.NewString()
	settingsRepo := settingsmocks.NewRepository(t)
	settingsRepo.EXPECT().GetIssuerSettings(ctx).Return(issuer, nil)

	idpFactory := idp.NewFactory()
	identityServ := identitymocks.NewService(t)
	identityServ.EXPECT().
		GenerateID(ctx, mock.Anything, &identitycore.Issuer{
			CommonName: issuer.IssuerID,
			KeyID:      issuer.KeyID,
		}).
		Return(resolverMetadataID, nil)

	credStore := idpmocks.NewCredentialStore(t)
	credStore.EXPECT().Put(ctx, mock.Anything, mock.Anything).Return(errors.New("failed"))
	sut := bff.NewAppService(
		nil,
		settingsRepo,
		identityServ,
		idpFactory,
		credStore,
		nil,
		nil,
		nil,
		nil,
		nil,
	)

	_, err := sut.CreateApp(ctx, app)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "unable to store client credentials")
}

func TestAppService_CreateApp_should_return_err_when_create_apikey_fails(t *testing.T) {
	t.Parallel()

	ctx := identitycontext.InsertUserID(context.Background(), uuid.NewString())
	app := &apptypes.App{
		Type: apptypes.APP_TYPE_AGENT_A2A,
	}
	issuer := &settingstypes.IssuerSettings{
		IssuerID: uuid.NewString(),
		KeyID:    uuid.NewString(),
		IdpType:  settingstypes.IDP_TYPE_SELF,
	}
	resolverMetadataID := uuid.NewString()
	settingsRepo := settingsmocks.NewRepository(t)
	settingsRepo.EXPECT().GetIssuerSettings(ctx).Return(issuer, nil)

	idpFactory := idp.NewFactory()
	identityServ := identitymocks.NewService(t)
	identityServ.EXPECT().
		GenerateID(ctx, mock.Anything, &identitycore.Issuer{
			CommonName: issuer.IssuerID,
			KeyID:      issuer.KeyID,
		}).
		Return(resolverMetadataID, nil)

	credStore := idpmocks.NewCredentialStore(t)
	credStore.EXPECT().Put(ctx, mock.Anything, mock.Anything).Return(nil)

	iamClient := iammocks.NewClient(t)
	iamClient.EXPECT().
		CreateAppAPIKey(ctx, mock.Anything).
		Return(&iamtypes.APIKey{}, errors.New("failed"))
	sut := bff.NewAppService(
		nil,
		settingsRepo,
		identityServ,
		idpFactory,
		credStore,
		iamClient,
		nil,
		nil,
		nil,
		nil,
	)

	_, err := sut.CreateApp(ctx, app)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed to generate an api key")
}

// UpdateApp

func TestAppService_UpdateApp_should_succeed(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	app := &apptypes.App{
		ID:          uuid.NewString(),
		Name:        ptrutil.Ptr("new_name"),
		Description: ptrutil.Ptr("new_description"),
	}
	storedApp := &apptypes.App{
		ID:   app.ID,
		Type: apptypes.APP_TYPE_MCP_SERVER,
	}
	appRepo := appmocks.NewRepository(t)
	appRepo.EXPECT().GetApp(ctx, app.ID).Return(storedApp, nil)
	appRepo.EXPECT().UpdateApp(ctx, storedApp).Return(nil)
	mockValidGetAppStatus(t, appRepo)
	iamClient := createValidIamClientWithGettersOnly(t)
	sut := bff.NewAppService(appRepo, nil, nil, nil, nil, iamClient, nil, nil, nil, nil)

	_, err := sut.UpdateApp(ctx, app)

	assert.NoError(t, err)
	assert.Equal(t, app.Name, storedApp.Name)
	assert.Equal(t, app.Description, storedApp.Description)
}

// GetApp

func TestAppService_GetApp_should_return_app(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	expectedApp := &apptypes.App{ID: uuid.NewString()}
	appRepo := appmocks.NewRepository(t)
	appRepo.EXPECT().GetApp(ctx, expectedApp.ID).Return(expectedApp, nil)
	mockValidGetAppStatus(t, appRepo)
	iamClient := createValidIamClientWithGettersOnly(t)
	sut := bff.NewAppService(appRepo, nil, nil, nil, nil, iamClient, nil, nil, nil, nil)

	app, err := sut.GetApp(ctx, expectedApp.ID)

	assert.NoError(t, err)
	assert.Equal(t, expectedApp, app)
}

func TestAppService_GetApp_should_return_not_found(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	invalidAppID := "INVALID_APP"
	appRepo := appmocks.NewRepository(t)
	appRepo.EXPECT().GetApp(ctx, invalidAppID).Return(nil, errors.New("not found"))
	sut := bff.NewAppService(appRepo, nil, nil, nil, nil, nil, nil, nil, nil, nil)

	app, err := sut.GetApp(ctx, invalidAppID)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "not found")
	assert.Nil(t, app)
}

func TestAppService_GetApp_should_return_err_if_id_is_empty(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	emptyAppID := ""
	sut := bff.NewAppService(nil, nil, nil, nil, nil, nil, nil, nil, nil, nil)

	app, err := sut.GetApp(ctx, emptyAppID)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "app ID cannot be empty")
	assert.Nil(t, app)
}

func TestAppService_GetApp_should_not_return_err_when_api_key_not_found(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	expectedApp := &apptypes.App{ID: uuid.NewString()}
	appRepo := appmocks.NewRepository(t)
	appRepo.EXPECT().GetApp(ctx, expectedApp.ID).Return(expectedApp, nil)
	mockValidGetAppStatus(t, appRepo)
	iamClient := iammocks.NewClient(t)
	iamClient.EXPECT().
		GetAppAPIKey(mock.Anything, mock.Anything).
		Return(&iamtypes.APIKey{}, errors.New("error"))
	sut := bff.NewAppService(appRepo, nil, nil, nil, nil, iamClient, nil, nil, nil, nil)

	app, err := sut.GetApp(ctx, expectedApp.ID)

	assert.NoError(t, err)
	assert.Equal(t, expectedApp, app)
}

// ListApps

func TestAppService_ListApps_should_return_a_list_of_apps(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	apps := &pagination.Pageable[apptypes.App]{
		Items: []*apptypes.App{},
		Total: 8,
		Page:  1,
		Size:  2,
	}
	appRepo := appmocks.NewRepository(t)
	appRepo.EXPECT().
		GetAllApps(ctx, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return(apps, nil)
	mockValidGetAppStatus(t, appRepo)
	sut := bff.NewAppService(appRepo, nil, nil, nil, nil, nil, nil, nil, nil, nil)

	returnedApps, err := sut.ListApps(
		ctx,
		pagination.PaginationFilter{},
		nil,
		nil,
		sorting.Sorting{},
	)

	assert.NoError(t, err)
	assert.Equal(t, apps, returnedApps)
}

// DeleteApp

func TestAppService_DeleteApp_should_succeed(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	app := &apptypes.App{ID: uuid.NewString()}
	appRepo := appmocks.NewRepository(t)
	appRepo.EXPECT().GetApp(ctx, app.ID).Return(app, nil)
	appRepo.EXPECT().DeleteApp(ctx, app).Return(nil)

	issuer := &settingstypes.IssuerSettings{
		IssuerID: uuid.NewString(),
		KeyID:    uuid.NewString(),
		IdpType:  settingstypes.IDP_TYPE_SELF,
	}
	settingsRepo := settingsmocks.NewRepository(t)
	settingsRepo.EXPECT().GetIssuerSettings(ctx).Return(issuer, nil)

	idpFactory := idp.NewFactory()

	credStore := idpmocks.NewCredentialStore(t)
	credStore.EXPECT().Get(ctx, app.ID).Return(&idp.ClientCredentials{}, nil)
	credStore.EXPECT().Delete(ctx, app.ID).Return(nil)

	keyStore := identitymocks.NewKeyStore(t)
	keyStore.EXPECT().RetrievePrivKey(ctx, issuer.KeyID).Return(&jwk.Jwk{}, nil)

	badgeRevoker := badgemocks.NewRevoker(t)
	badgeRevoker.EXPECT().RevokeAll(
		ctx,
		app.ID,
		mock.Anything,
		&identitycore.Issuer{CommonName: issuer.IssuerID, KeyID: issuer.KeyID},
		mock.Anything,
	).Return(nil)

	policyRepo := policymocks.NewRepository(t)
	policyRepo.EXPECT().DeletePoliciesByAppID(ctx, app.ID).Return(nil)
	policyRepo.EXPECT().DeleteTasksByAppID(ctx, app.ID).Return(nil)

	sut := bff.NewAppService(
		appRepo,
		settingsRepo,
		nil,
		idpFactory,
		credStore,
		nil,
		badgeRevoker,
		keyStore,
		policyRepo,
		nil,
	)

	err := sut.DeleteApp(ctx, app.ID)

	assert.NoError(t, err)
}

func TestAppService_DeleteApp_should_delete_app_without_client_cred_pair(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	app := &apptypes.App{ID: uuid.NewString()}
	appRepo := appmocks.NewRepository(t)
	appRepo.EXPECT().GetApp(ctx, app.ID).Return(app, nil)
	appRepo.EXPECT().DeleteApp(ctx, app).Return(nil)

	issuer := &settingstypes.IssuerSettings{
		IssuerID: uuid.NewString(),
		KeyID:    uuid.NewString(),
		IdpType:  settingstypes.IDP_TYPE_SELF,
	}
	settingsRepo := settingsmocks.NewRepository(t)
	settingsRepo.EXPECT().GetIssuerSettings(ctx).Return(issuer, nil)

	idpFactory := idp.NewFactory()

	credStore := idpmocks.NewCredentialStore(t)
	credStore.EXPECT().Get(ctx, app.ID).Return(nil, idp.ErrCredentialNotFound)
	credStore.EXPECT().Delete(ctx, app.ID).Return(nil)

	policyRepo := policymocks.NewRepository(t)
	policyRepo.EXPECT().DeletePoliciesByAppID(ctx, app.ID).Return(nil)
	policyRepo.EXPECT().DeleteTasksByAppID(ctx, app.ID).Return(nil)

	sut := bff.NewAppService(
		appRepo,
		settingsRepo,
		nil,
		idpFactory,
		credStore,
		nil,
		nil,
		nil,
		policyRepo,
		nil,
	)

	err := sut.DeleteApp(ctx, app.ID)

	assert.NoError(t, err)
}

// RefreshAppAPIKey

func TestAppService_RefreshAppAPIKey_should_call_update_with_refreshed_api_key(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	app := &apptypes.App{ID: uuid.NewString(), ApiKey: "OLD_KEY"}
	refreshedAPIKey := &iamtypes.APIKey{Secret: ptrutil.Ptr("NEW_KEY")}
	appRepo := appmocks.NewRepository(t)
	appRepo.EXPECT().GetApp(ctx, app.ID).Return(app, nil)
	appRepo.EXPECT().
		UpdateApp(ctx, &apptypes.App{ID: app.ID, ApiKey: ptrutil.DerefStr(refreshedAPIKey.Secret)}).
		Return(nil)

	iamClient := iammocks.NewClient(t)
	iamClient.EXPECT().RefreshAppAPIKey(ctx, app.ID).Return(refreshedAPIKey, nil)

	sut := bff.NewAppService(appRepo, nil, nil, nil, nil, iamClient, nil, nil, nil, nil)

	returnedApp, err := sut.RefreshAppAPIKey(ctx, app.ID)

	assert.NoError(t, err)
	assert.Equal(t, *refreshedAPIKey.Secret, returnedApp.ApiKey)
}

func mockValidGetAppStatus(t *testing.T, repo *appmocks.Repository) {
	t.Helper()

	repo.EXPECT().
		GetAppStatuses(mock.Anything, mock.Anything).
		Return(map[string]apptypes.AppStatus{}, nil)
}

func createValidIamClientWithGettersOnly(t *testing.T) *iammocks.Client {
	t.Helper()

	iamClient := iammocks.NewClient(t)
	iamClient.EXPECT().
		GetAppAPIKey(mock.Anything, mock.Anything).
		Return(&iamtypes.APIKey{}, nil)

	return iamClient
}
