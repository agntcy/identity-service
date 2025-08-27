// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Appentifier: Apache-2.0

package bff_test

import (
	"context"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/agntcy/identity/pkg/joseutil"
	"github.com/agntcy/identity/pkg/jwk"
	"github.com/google/uuid"
	"github.com/outshift/identity-service/internal/bff"
	appmocks "github.com/outshift/identity-service/internal/core/app/mocks"
	apptypes "github.com/outshift/identity-service/internal/core/app/types"
	authmocks "github.com/outshift/identity-service/internal/core/auth/mocks"
	authtypes "github.com/outshift/identity-service/internal/core/auth/types/int"
	identitymocks "github.com/outshift/identity-service/internal/core/identity/mocks"
	idpcore "github.com/outshift/identity-service/internal/core/idp"
	idpmocks "github.com/outshift/identity-service/internal/core/idp/mocks"
	policymocks "github.com/outshift/identity-service/internal/core/policy/mocks"
	policytypes "github.com/outshift/identity-service/internal/core/policy/types"
	settingsmocks "github.com/outshift/identity-service/internal/core/settings/mocks"
	settingstypes "github.com/outshift/identity-service/internal/core/settings/types"
	identitycontext "github.com/outshift/identity-service/internal/pkg/context"
	oidctesting "github.com/outshift/identity-service/internal/pkg/oidc/testing"
	"github.com/outshift/identity-service/internal/pkg/ptrutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

const (
	validOwnerAppID = "owner-app-id"
)

// Authorize

func TestAuthService_Authorize_should_generate_auth_code(t *testing.T) {
	t.Parallel()

	ctx := identitycontext.InsertAppID(context.Background(), validOwnerAppID)
	authRepo := authmocks.NewRepository(t)
	authRepo.EXPECT().
		Create(mock.Anything, mock.Anything).
		RunAndReturn(func(_ context.Context, s *authtypes.Session) (*authtypes.Session, error) {
			return s, nil
		})
	appRepo := appmocks.NewRepository(t)
	appRepo.EXPECT().
		GetApp(mock.Anything, mock.Anything).
		Return(&apptypes.App{ID: validOwnerAppID}, nil)
	sut := bff.NewAuthService(authRepo, nil, nil, appRepo, nil, nil, nil, nil, nil)

	session, err := sut.Authorize(ctx, nil, nil, nil)

	assert.NoError(t, err)
	assert.NotEmpty(t, session.AuthorizationCode)
	assert.Greater(t, *session.ExpiresAt, time.Now().Unix())
}

func TestAuthService_Authorize_should_generate_auth_code_for_specific_app(t *testing.T) {
	t.Parallel()

	calledApp := &apptypes.App{ID: "specific-app-id"}
	resolverMetadataID := uuid.NewString()
	ctx := identitycontext.InsertAppID(context.Background(), validOwnerAppID)
	authRepo := authmocks.NewRepository(t)
	authRepo.EXPECT().
		Create(mock.Anything, mock.Anything).
		RunAndReturn(func(_ context.Context, s *authtypes.Session) (*authtypes.Session, error) {
			return s, nil
		})
	appRepo := appmocks.NewRepository(t)
	appRepo.EXPECT().
		GetApp(mock.Anything, mock.Anything).
		RunAndReturn(func(ctx context.Context, id string) (*apptypes.App, error) {
			return &apptypes.App{ID: id}, nil
		})
	appRepo.EXPECT().
		GetAppByResolverMetadataID(mock.Anything, resolverMetadataID).
		Return(calledApp, nil)
	policyEvaluator := policymocks.NewEvaluator(t)
	policyEvaluator.EXPECT().
		Evaluate(mock.Anything, calledApp, validOwnerAppID, "").
		Return(&policytypes.Rule{}, nil)
	sut := bff.NewAuthService(authRepo, nil, nil, appRepo, policyEvaluator, nil, nil, nil, nil)

	session, err := sut.Authorize(ctx, &resolverMetadataID, nil, nil)

	assert.NoError(t, err)
	assert.NotEmpty(t, session.AuthorizationCode)
	assert.Greater(t, *session.ExpiresAt, time.Now().Unix())
}

func TestAuthService_Authorize_should_generate_session_for_tool(t *testing.T) {
	t.Parallel()

	calledApp := &apptypes.App{ID: "specific-app-id"}
	resolverMetadataID := uuid.NewString()
	toolName := "cool_tool"
	ctx := identitycontext.InsertAppID(context.Background(), validOwnerAppID)
	authRepo := authmocks.NewRepository(t)
	authRepo.EXPECT().
		Create(mock.Anything, mock.Anything).
		RunAndReturn(func(_ context.Context, s *authtypes.Session) (*authtypes.Session, error) {
			return s, nil
		})
	appRepo := appmocks.NewRepository(t)
	appRepo.EXPECT().
		GetApp(mock.Anything, mock.Anything).
		RunAndReturn(func(ctx context.Context, id string) (*apptypes.App, error) {
			return &apptypes.App{ID: id}, nil
		})
	appRepo.EXPECT().
		GetAppByResolverMetadataID(mock.Anything, resolverMetadataID).
		Return(calledApp, nil)
	policyEvaluator := policymocks.NewEvaluator(t)
	policyEvaluator.EXPECT().
		Evaluate(mock.Anything, calledApp, validOwnerAppID, toolName).
		Return(&policytypes.Rule{}, nil)
	sut := bff.NewAuthService(authRepo, nil, nil, appRepo, policyEvaluator, nil, nil, nil, nil)

	session, err := sut.Authorize(ctx, &resolverMetadataID, &toolName, nil)

	assert.NoError(t, err)
	assert.NotEmpty(t, session.AuthorizationCode)
	assert.Greater(t, *session.ExpiresAt, time.Now().Unix())
	assert.Equal(t, toolName, *session.ToolName)
}

func TestAuthService_Authorize_should_return_err_when_owner_app_not_in_context(t *testing.T) {
	t.Parallel()

	cases := []*string{nil, ptrutil.Ptr("")}

	for _, c := range cases {
		t.Run(fmt.Sprintf("case %v", c), func(t *testing.T) {
			t.Parallel()

			invalidCtx := context.Background()
			if c != nil {
				invalidCtx = identitycontext.InsertAppID(invalidCtx, *c)
			}

			sut := bff.NewAuthService(nil, nil, nil, nil, nil, nil, nil, nil, nil)

			_, err := sut.Authorize(invalidCtx, nil, nil, nil)

			assert.Error(t, err)
			assert.ErrorContains(t, err, "app ID not found in context")
		})
	}
}

func TestAuthService_Authorize_should_return_err_when_resolver_metadata_id_invalid(t *testing.T) {
	t.Parallel()

	invalidResolverMD := "invalid"
	ctx := identitycontext.InsertAppID(context.Background(), validOwnerAppID)
	appRepo := appmocks.NewRepository(t)
	appRepo.EXPECT().
		GetApp(mock.Anything, mock.Anything).
		RunAndReturn(func(ctx context.Context, id string) (*apptypes.App, error) {
			return &apptypes.App{ID: id}, nil
		})
	appRepo.EXPECT().
		GetAppByResolverMetadataID(mock.Anything, invalidResolverMD).
		Return(nil, errors.New("invalid"))
	sut := bff.NewAuthService(nil, nil, nil, appRepo, nil, nil, nil, nil, nil)

	_, err := sut.Authorize(ctx, &invalidResolverMD, nil, nil)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "app not found")
}

func TestAuthService_Authorize_should_return_err_when_called_app_is_same_as_owner_app(t *testing.T) {
	t.Parallel()

	invalidCalledApp := &apptypes.App{ID: validOwnerAppID}
	resolverMetadataID := uuid.NewString()
	ctx := identitycontext.InsertAppID(context.Background(), validOwnerAppID)
	appRepo := appmocks.NewRepository(t)
	appRepo.EXPECT().
		GetApp(mock.Anything, mock.Anything).
		RunAndReturn(func(ctx context.Context, id string) (*apptypes.App, error) {
			return &apptypes.App{ID: id}, nil
		})
	appRepo.EXPECT().
		GetAppByResolverMetadataID(mock.Anything, resolverMetadataID).
		Return(invalidCalledApp, nil)
	sut := bff.NewAuthService(nil, nil, nil, appRepo, nil, nil, nil, nil, nil)

	_, err := sut.Authorize(ctx, &resolverMetadataID, nil, nil)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "cannot authorize the same app")
}

func TestAuthService_Authorize_should_return_err_when_owner_app_not_found(t *testing.T) {
	t.Parallel()

	invalidOwnerAppID := "invalid-owner-app-id"
	ctx := identitycontext.InsertAppID(context.Background(), invalidOwnerAppID)
	appRepo := appmocks.NewRepository(t)
	appRepo.EXPECT().
		GetApp(mock.Anything, mock.Anything).
		Return(nil, errors.New("invalid"))
	sut := bff.NewAuthService(nil, nil, nil, appRepo, nil, nil, nil, nil, nil)

	_, err := sut.Authorize(ctx, nil, nil, nil)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "app not found")
}

func TestAuthService_Authorize_should_return_err_when_policy_evaluation_fails(t *testing.T) {
	t.Parallel()

	calledApp := &apptypes.App{ID: "specific-app-id"}
	resolverMetadataID := uuid.NewString()
	ctx := identitycontext.InsertAppID(context.Background(), validOwnerAppID)
	appRepo := appmocks.NewRepository(t)
	appRepo.EXPECT().
		GetApp(mock.Anything, mock.Anything).
		RunAndReturn(func(ctx context.Context, id string) (*apptypes.App, error) {
			return &apptypes.App{ID: id}, nil
		})
	appRepo.EXPECT().
		GetAppByResolverMetadataID(mock.Anything, resolverMetadataID).
		Return(calledApp, nil)
	policyEvaluator := policymocks.NewEvaluator(t)
	policyEvaluator.EXPECT().
		Evaluate(mock.Anything, calledApp, validOwnerAppID, "").
		Return(nil, errors.New("invalid evaluation"))
	sut := bff.NewAuthService(nil, nil, nil, appRepo, policyEvaluator, nil, nil, nil, nil)

	_, err := sut.Authorize(ctx, &resolverMetadataID, nil, nil)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "invalid evaluation")
}

// Token

func TestAuthService_Token_should_return_an_access_token_with_idp(t *testing.T) {
	t.Parallel()

	authCode := uuid.NewString()
	session := &authtypes.Session{OwnerAppID: validOwnerAppID}
	authRepo := authmocks.NewRepository(t)
	authRepo.EXPECT().GetByAuthorizationCode(mock.Anything, authCode).Return(session, nil)
	authRepo.EXPECT().GetByAccessToken(mock.Anything, mock.Anything).Return(nil, errors.New("not found"))
	authRepo.EXPECT().Update(mock.Anything, session).Return(nil)
	credStore := idpmocks.NewCredentialStore(t)
	credStore.EXPECT().
		Get(mock.Anything, session.OwnerAppID).
		Return(&idpcore.ClientCredentials{ClientSecret: "secret"}, nil)
	settingsRepo := settingsmocks.NewRepository(t)
	settingsRepo.EXPECT().GetIssuerSettings(mock.Anything).Return(&settingstypes.IssuerSettings{
		IdpType: settingstypes.IDP_TYPE_DUO,
	}, nil)
	authenticator := oidctesting.NewValidAuthenticator()
	sut := bff.NewAuthService(authRepo, credStore, authenticator, nil, nil, nil, nil, settingsRepo, nil)

	returnedSess, err := sut.Token(context.Background(), authCode)

	assert.NoError(t, err)
	assert.NotEmpty(t, returnedSess.AccessToken)
}

func TestAuthService_Token_should_return_an_access_token_as_self_issuer(t *testing.T) {
	t.Parallel()

	authCode := uuid.NewString()
	session := &authtypes.Session{OwnerAppID: validOwnerAppID}
	authRepo := authmocks.NewRepository(t)
	authRepo.EXPECT().GetByAuthorizationCode(mock.Anything, authCode).Return(session, nil)
	authRepo.EXPECT().GetByAccessToken(mock.Anything, mock.Anything).Return(nil, errors.New("not found"))
	authRepo.EXPECT().Update(mock.Anything, session).Return(nil)
	credStore := idpmocks.NewCredentialStore(t)
	credStore.EXPECT().
		Get(mock.Anything, session.OwnerAppID).
		Return(&idpcore.ClientCredentials{ClientID: "ID", Issuer: "Issuer"}, nil)
	settingsRepo := settingsmocks.NewRepository(t)
	settingsRepo.EXPECT().GetIssuerSettings(mock.Anything).Return(&settingstypes.IssuerSettings{
		IdpType: settingstypes.IDP_TYPE_SELF,
	}, nil)
	keyStore := identitymocks.NewKeyStore(t)
	priv, _ := joseutil.GenerateJWK("RS256", "sig", "keyId")
	keyStore.EXPECT().RetrievePrivKey(mock.Anything, mock.Anything).Return(priv, nil)
	sut := bff.NewAuthService(authRepo, credStore, nil, nil, nil, nil, nil, settingsRepo, keyStore)

	returnedSess, err := sut.Token(context.Background(), authCode)

	assert.NoError(t, err)
	assert.NotEmpty(t, returnedSess.AccessToken)
}

func TestAuthService_Token_should_expire_session_with_same_access_token(t *testing.T) {
	t.Parallel()

	authCode := uuid.NewString()
	session := &authtypes.Session{OwnerAppID: validOwnerAppID}
	existingSession := &authtypes.Session{AccessToken: ptrutil.Ptr("existingtoken")}
	authRepo := authmocks.NewRepository(t)
	authRepo.EXPECT().GetByAuthorizationCode(mock.Anything, authCode).Return(session, nil)
	authRepo.EXPECT().GetByAccessToken(mock.Anything, mock.Anything).Return(existingSession, nil)
	authRepo.EXPECT().Update(mock.Anything, session).Once().Return(nil)
	credStore := idpmocks.NewCredentialStore(t)
	credStore.EXPECT().
		Get(mock.Anything, session.OwnerAppID).
		Return(&idpcore.ClientCredentials{ClientSecret: "secret"}, nil)
	settingsRepo := settingsmocks.NewRepository(t)
	settingsRepo.EXPECT().GetIssuerSettings(mock.Anything).Return(&settingstypes.IssuerSettings{
		IdpType: settingstypes.IDP_TYPE_DUO,
	}, nil)
	authenticator := oidctesting.NewValidAuthenticator()
	sut := bff.NewAuthService(authRepo, credStore, authenticator, nil, nil, nil, nil, settingsRepo, nil)

	returnedSess, err := sut.Token(context.Background(), authCode)

	assert.NoError(t, err)
	assert.Equal(t, existingSession.AccessToken, returnedSess.AccessToken)
	assert.Less(t, *session.ExpiresAt, time.Now().Unix())
}

func TestAuthService_Token_should_return_err_if_auth_code_is_empty(t *testing.T) {
	t.Parallel()

	emptyAuthCode := ""
	sut := bff.NewAuthService(nil, nil, nil, nil, nil, nil, nil, nil, nil)

	_, err := sut.Token(context.Background(), emptyAuthCode)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "authorization code")
}

func TestAuthService_Token_should_return_err_if_auth_code_not_stored(t *testing.T) {
	t.Parallel()

	invalidAuthCode := "invalid"
	authRepo := authmocks.NewRepository(t)
	authRepo.EXPECT().GetByAuthorizationCode(mock.Anything, invalidAuthCode).Return(nil, errors.New("not found"))
	sut := bff.NewAuthService(authRepo, nil, nil, nil, nil, nil, nil, nil, nil)

	_, err := sut.Token(context.Background(), invalidAuthCode)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "invalid session")
}

func TestAuthService_Token_should_return_err_if_session_already_has_access_token(t *testing.T) {
	t.Parallel()

	authCode := uuid.NewString()
	session := &authtypes.Session{AccessToken: ptrutil.Ptr("exists")}
	authRepo := authmocks.NewRepository(t)
	authRepo.EXPECT().GetByAuthorizationCode(mock.Anything, authCode).Return(session, nil)
	sut := bff.NewAuthService(authRepo, nil, nil, nil, nil, nil, nil, nil, nil)

	_, err := sut.Token(context.Background(), authCode)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "a token has already been issued")
}

func TestAuthService_Token_should_return_err_if_client_cred_not_found(t *testing.T) {
	t.Parallel()

	authCode := uuid.NewString()
	session := &authtypes.Session{OwnerAppID: validOwnerAppID}
	authRepo := authmocks.NewRepository(t)
	authRepo.EXPECT().GetByAuthorizationCode(mock.Anything, authCode).Return(session, nil)
	credStore := idpmocks.NewCredentialStore(t)
	credStore.EXPECT().Get(mock.Anything, session.OwnerAppID).Return(nil, errors.New("not found"))
	sut := bff.NewAuthService(authRepo, credStore, nil, nil, nil, nil, nil, nil, nil)

	_, err := sut.Token(context.Background(), authCode)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed to get client credentials")
}

func TestAuthService_Token_should_return_err_if_issuer_not_found(t *testing.T) {
	t.Parallel()

	authCode := uuid.NewString()
	session := &authtypes.Session{OwnerAppID: validOwnerAppID}
	authRepo := authmocks.NewRepository(t)
	authRepo.EXPECT().GetByAuthorizationCode(mock.Anything, authCode).Return(session, nil)
	credStore := idpmocks.NewCredentialStore(t)
	credStore.EXPECT().
		Get(mock.Anything, session.OwnerAppID).
		Return(&idpcore.ClientCredentials{ClientSecret: "secret"}, nil)
	settingsRepo := settingsmocks.NewRepository(t)
	settingsRepo.EXPECT().GetIssuerSettings(mock.Anything).Return(nil, errors.New("not found"))
	sut := bff.NewAuthService(authRepo, credStore, nil, nil, nil, nil, nil, settingsRepo, nil)

	_, err := sut.Token(context.Background(), authCode)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed to fetch issuer settings")
}

func TestAuthService_Token_should_return_err_if_access_token_generation_fails(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		idpType      settingstypes.IdpType
		clientSecret string
	}{
		{idpType: settingstypes.IDP_TYPE_DUO, clientSecret: "not null"},
		{idpType: settingstypes.IDP_TYPE_OKTA, clientSecret: "not null"},
		{idpType: settingstypes.IDP_TYPE_ORY, clientSecret: "not null"},
		{idpType: settingstypes.IDP_TYPE_ORY, clientSecret: ""},
		{idpType: settingstypes.IDP_TYPE_SELF, clientSecret: ""},
		{idpType: settingstypes.IDP_TYPE_SELF, clientSecret: "not null"},
		{idpType: settingstypes.IDP_TYPE_UNSPECIFIED, clientSecret: ""},
	}

	authCode := uuid.NewString()
	session := &authtypes.Session{OwnerAppID: validOwnerAppID}
	authRepo := authmocks.NewRepository(t)
	authRepo.EXPECT().GetByAuthorizationCode(mock.Anything, authCode).Return(session, nil)

	var sut bff.AuthService

	for _, tc := range testCases {
		t.Run(fmt.Sprintf("case %s", tc.idpType.String()), func(t *testing.T) {
			t.Parallel()

			credStore := idpmocks.NewCredentialStore(t)
			credStore.EXPECT().
				Get(mock.Anything, session.OwnerAppID).
				Return(&idpcore.ClientCredentials{ClientSecret: tc.clientSecret}, nil)

			settingsRepo := settingsmocks.NewRepository(t)
			settingsRepo.EXPECT().GetIssuerSettings(mock.Anything).Return(&settingstypes.IssuerSettings{
				IdpType: tc.idpType,
			}, nil)

			switch tc.idpType {
			case settingstypes.IDP_TYPE_SELF:
				keyStore := identitymocks.NewKeyStore(t)
				keyStore.EXPECT().RetrievePrivKey(mock.Anything, mock.Anything).Return(&jwk.Jwk{}, nil)
				sut = bff.NewAuthService(authRepo, credStore, nil, nil, nil, nil, nil, settingsRepo, keyStore)
			case settingstypes.IDP_TYPE_UNSPECIFIED:
				sut = bff.NewAuthService(authRepo, credStore, nil, nil, nil, nil, nil, settingsRepo, nil)
			default:
				authenticator := oidctesting.NewErroneousAuthenticator()
				sut = bff.NewAuthService(authRepo, credStore, authenticator, nil, nil, nil, nil, settingsRepo, nil)
			}

			_, err := sut.Token(context.Background(), authCode)

			assert.Error(t, err)
			assert.ErrorContains(t, err, "failed to issue token")
		})
	}
}

func TestAuthService_Token_should_return_err_if_update_fails(t *testing.T) {
	t.Parallel()

	authCode := uuid.NewString()
	session := &authtypes.Session{OwnerAppID: validOwnerAppID}
	authRepo := authmocks.NewRepository(t)
	authRepo.EXPECT().GetByAuthorizationCode(mock.Anything, authCode).Return(session, nil)
	authRepo.EXPECT().GetByAccessToken(mock.Anything, mock.Anything).Return(nil, errors.New("not found"))
	authRepo.EXPECT().Update(mock.Anything, session).Return(errors.New("error"))
	credStore := idpmocks.NewCredentialStore(t)
	credStore.EXPECT().
		Get(mock.Anything, session.OwnerAppID).
		Return(&idpcore.ClientCredentials{ClientSecret: "secret"}, nil)
	settingsRepo := settingsmocks.NewRepository(t)
	settingsRepo.EXPECT().GetIssuerSettings(mock.Anything).Return(&settingstypes.IssuerSettings{
		IdpType: settingstypes.IDP_TYPE_DUO,
	}, nil)
	authenticator := oidctesting.NewValidAuthenticator()
	sut := bff.NewAuthService(authRepo, credStore, authenticator, nil, nil, nil, nil, settingsRepo, nil)

	_, err := sut.Token(context.Background(), authCode)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed to update the session")
}
