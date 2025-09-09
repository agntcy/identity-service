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
	"github.com/agntcy/identity/pkg/oidc"
	"github.com/google/uuid"
	"github.com/outshift/identity-service/internal/bff"
	bffmocks "github.com/outshift/identity-service/internal/bff/mocks"
	appmocks "github.com/outshift/identity-service/internal/core/app/mocks"
	apptypes "github.com/outshift/identity-service/internal/core/app/types"
	authmocks "github.com/outshift/identity-service/internal/core/auth/mocks"
	authtypes "github.com/outshift/identity-service/internal/core/auth/types/int"
	devicemocks "github.com/outshift/identity-service/internal/core/device/mocks"
	devicetypes "github.com/outshift/identity-service/internal/core/device/types"
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

// ExtAuthZ

func TestAuthService_ExtAuthZ_should_succeed(t *testing.T) {
	t.Parallel()

	testCases := []*struct {
		session          authtypes.Session
		inputToolName    *string
		inputCalledAppID string
	}{
		{
			session: authtypes.Session{
				OwnerAppID: uuid.NewString(),
			},
		},
		{
			session: authtypes.Session{
				OwnerAppID: uuid.NewString(),
				AppID:      ptrutil.Ptr("called_app_id"),
			},
			inputCalledAppID: "called_app_id",
		},
		{
			session: authtypes.Session{
				OwnerAppID: uuid.NewString(),
				ToolName:   ptrutil.Ptr("cool_tool"),
			},
			inputToolName: ptrutil.Ptr("cool_tool"),
		},
	}

	for i, tc := range testCases {
		t.Run(fmt.Sprintf("case %d", i), func(t *testing.T) {
			t.Parallel()

			accessToken := generateValidJWT(t)
			calledApp := &apptypes.App{ID: tc.inputCalledAppID}
			ctx := identitycontext.InsertAppID(context.Background(), calledApp.ID)
			authRepo := authmocks.NewRepository(t)
			authRepo.EXPECT().
				GetByAccessToken(ctx, accessToken).
				Return(&tc.session, nil)
			authRepo.EXPECT().Update(ctx, &tc.session).Return(nil)

			appRepo := appmocks.NewRepository(t)
			appRepo.EXPECT().GetApp(ctx, calledApp.ID).Return(calledApp, nil)
			appRepo.EXPECT().
				GetApp(ctx, tc.session.OwnerAppID).
				Return(&apptypes.App{ID: tc.session.OwnerAppID}, nil)

			policyEva := policymocks.NewEvaluator(t)
			policyEva.EXPECT().
				Evaluate(ctx, calledApp, tc.session.OwnerAppID, ptrutil.DerefStr(tc.session.ToolName)).
				Return(&policytypes.Rule{NeedsApproval: false}, nil)
			sut := bff.NewAuthService(authRepo, nil, nil, appRepo, policyEva, nil, nil, nil, nil)

			err := sut.ExtAuthZ(ctx, accessToken, ptrutil.DerefStr(tc.inputToolName))

			assert.NoError(t, err)
		})
	}
}

func TestAuthService_ExtAuthZ_should_return_err_for_empty_access_token(t *testing.T) {
	t.Parallel()

	emptyAccessToken := ""
	sut := bff.NewAuthService(nil, nil, nil, nil, nil, nil, nil, nil, nil)

	err := sut.ExtAuthZ(context.Background(), emptyAccessToken, "")

	assert.Error(t, err)
	assert.ErrorContains(t, err, "access token cannot be empty")
}

func TestAuthService_ExtAuthZ_should_return_err_when_session_not_found(t *testing.T) {
	t.Parallel()

	invalidAccessToken := "INVALID"
	authRepo := authmocks.NewRepository(t)
	authRepo.EXPECT().
		GetByAccessToken(mock.Anything, invalidAccessToken).
		Return(nil, errors.New("not found"))
	sut := bff.NewAuthService(authRepo, nil, nil, nil, nil, nil, nil, nil, nil)

	err := sut.ExtAuthZ(context.Background(), invalidAccessToken, "")

	assert.Error(t, err)
	assert.ErrorContains(t, err, "invalid session")
}

func TestAuthService_ExtAuthZ_should_return_err_when_session_is_expired(t *testing.T) {
	t.Parallel()

	accessToken := generateValidJWT(t)
	authRepo := authmocks.NewRepository(t)
	authRepo.EXPECT().
		GetByAccessToken(mock.Anything, accessToken).
		Return(&authtypes.Session{
			ExpiresAt: ptrutil.Ptr(time.Now().Add(-1 * time.Second).Unix()),
		}, nil)
	sut := bff.NewAuthService(authRepo, nil, nil, nil, nil, nil, nil, nil, nil)

	err := sut.ExtAuthZ(context.Background(), accessToken, "")

	assert.Error(t, err)
	assert.ErrorContains(t, err, "the session has expired")
}

func TestAuthService_ExtAuthZ_should_return_err_when_called_app_not_found(t *testing.T) {
	t.Parallel()

	accessToken := generateValidJWT(t)
	invalidCalledApp := &apptypes.App{ID: "INVALID_APP"}
	ctx := identitycontext.InsertAppID(context.Background(), invalidCalledApp.ID)
	authRepo := authmocks.NewRepository(t)
	authRepo.EXPECT().
		GetByAccessToken(ctx, accessToken).
		Return(&authtypes.Session{}, nil)

	appRepo := appmocks.NewRepository(t)
	appRepo.EXPECT().GetApp(ctx, invalidCalledApp.ID).Return(nil, errors.New("not found"))
	sut := bff.NewAuthService(authRepo, nil, nil, appRepo, nil, nil, nil, nil, nil)

	err := sut.ExtAuthZ(ctx, accessToken, "")

	assert.Error(t, err)
	assert.ErrorContains(t, err, "app not found")
}

func TestAuthService_ExtAuthZ_should_return_err_when_called_app_is_not_same_as_in_session(t *testing.T) {
	t.Parallel()

	accessToken := generateValidJWT(t)
	invalidCalledApp := &apptypes.App{ID: "INVALID_APP"}
	ctx := identitycontext.InsertAppID(context.Background(), invalidCalledApp.ID)
	authRepo := authmocks.NewRepository(t)
	authRepo.EXPECT().
		GetByAccessToken(ctx, accessToken).
		Return(&authtypes.Session{AppID: ptrutil.Ptr("VALID_APP")}, nil)

	appRepo := appmocks.NewRepository(t)
	appRepo.EXPECT().GetApp(ctx, invalidCalledApp.ID).Return(invalidCalledApp, nil)
	sut := bff.NewAuthService(authRepo, nil, nil, appRepo, nil, nil, nil, nil, nil)

	err := sut.ExtAuthZ(ctx, accessToken, "")

	assert.Error(t, err)
	assert.ErrorContains(t, err, "access token is not valid for the specified app")
}

func TestAuthService_ExtAuthZ_should_return_err_when_tool_name_is_not_same_as_in_session(t *testing.T) {
	t.Parallel()

	accessToken := generateValidJWT(t)
	calledApp := &apptypes.App{ID: uuid.NewString()}
	ctx := identitycontext.InsertAppID(context.Background(), calledApp.ID)
	invalidToolName := "INVALID_TOOL"
	authRepo := authmocks.NewRepository(t)
	authRepo.EXPECT().
		GetByAccessToken(ctx, accessToken).
		Return(&authtypes.Session{ToolName: ptrutil.Ptr("VALID_TOOL")}, nil)

	appRepo := appmocks.NewRepository(t)
	appRepo.EXPECT().GetApp(ctx, calledApp.ID).Return(calledApp, nil)
	sut := bff.NewAuthService(authRepo, nil, nil, appRepo, nil, nil, nil, nil, nil)

	err := sut.ExtAuthZ(ctx, accessToken, invalidToolName)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "access token is not valid for the specified tool")
}

func TestAuthService_ExtAuthZ_should_return_err_when_caller_app_not_found(t *testing.T) {
	t.Parallel()

	accessToken := generateValidJWT(t)
	session := &authtypes.Session{OwnerAppID: "INVALID_CALLED_APP"}
	calledApp := &apptypes.App{ID: uuid.NewString()}
	ctx := identitycontext.InsertAppID(context.Background(), calledApp.ID)
	authRepo := authmocks.NewRepository(t)
	authRepo.EXPECT().
		GetByAccessToken(ctx, accessToken).
		Return(session, nil)

	appRepo := appmocks.NewRepository(t)
	appRepo.EXPECT().GetApp(ctx, calledApp.ID).Return(calledApp, nil)
	appRepo.EXPECT().GetApp(ctx, session.OwnerAppID).Return(nil, errors.New("not found"))
	sut := bff.NewAuthService(authRepo, nil, nil, appRepo, nil, nil, nil, nil, nil)

	err := sut.ExtAuthZ(ctx, accessToken, "")

	assert.Error(t, err)
	assert.ErrorContains(t, err, "the caller app not found")
}

func TestAuthService_ExtAuthZ_should_return_err_when_access_token_invalid(t *testing.T) {
	t.Parallel()

	accessToken := "INVALID_ACCESS_TOKEN"
	calledApp := &apptypes.App{ID: uuid.NewString()}
	ctx := identitycontext.InsertAppID(context.Background(), calledApp.ID)
	session := &authtypes.Session{OwnerAppID: uuid.NewString()}
	authRepo := authmocks.NewRepository(t)
	authRepo.EXPECT().
		GetByAccessToken(ctx, accessToken).
		Return(session, nil)

	appRepo := appmocks.NewRepository(t)
	appRepo.EXPECT().GetApp(ctx, calledApp.ID).Return(calledApp, nil)
	appRepo.EXPECT().
		GetApp(ctx, session.OwnerAppID).
		Return(&apptypes.App{ID: session.OwnerAppID}, nil)
	sut := bff.NewAuthService(authRepo, nil, nil, appRepo, nil, nil, nil, nil, nil)

	err := sut.ExtAuthZ(ctx, accessToken, "")

	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed to parse JWT")
}

func TestAuthService_ExtAuthZ_should_return_err_if_update_fails(t *testing.T) {
	t.Parallel()

	accessToken := generateValidJWT(t)
	calledApp := &apptypes.App{ID: uuid.NewString()}
	ctx := identitycontext.InsertAppID(context.Background(), calledApp.ID)
	session := &authtypes.Session{OwnerAppID: uuid.NewString()}
	authRepo := authmocks.NewRepository(t)
	authRepo.EXPECT().
		GetByAccessToken(ctx, accessToken).
		Return(session, nil)
	authRepo.EXPECT().Update(ctx, session).Return(errors.New("failed update"))

	appRepo := appmocks.NewRepository(t)
	appRepo.EXPECT().GetApp(ctx, calledApp.ID).Return(calledApp, nil)
	appRepo.EXPECT().
		GetApp(ctx, session.OwnerAppID).
		Return(&apptypes.App{ID: session.OwnerAppID}, nil)

	policyEva := policymocks.NewEvaluator(t)
	policyEva.EXPECT().
		Evaluate(ctx, calledApp, session.OwnerAppID, "").
		Return(&policytypes.Rule{NeedsApproval: false}, nil)
	sut := bff.NewAuthService(authRepo, nil, nil, appRepo, policyEva, nil, nil, nil, nil)

	err := sut.ExtAuthZ(ctx, accessToken, "")

	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed update")
}

func TestAuthService_ExtAuthZ_should_send_device_otp_and_continue_after_approving(t *testing.T) {
	t.Parallel()

	accessToken := generateValidJWT(t)
	callerApp := &apptypes.App{ID: uuid.NewString()}
	calledApp := &apptypes.App{ID: uuid.NewString()}
	ctx := identitycontext.InsertAppID(context.Background(), calledApp.ID)
	session := &authtypes.Session{
		OwnerAppID: callerApp.ID,
		UserID:     ptrutil.Ptr(uuid.NewString()),
	}
	deviceOTP := &authtypes.SessionDeviceOTP{
		Used:      false,
		Approved:  ptrutil.Ptr(true),
		ExpiresAt: time.Now().Add(time.Minute).Unix(),
	}
	authRepo := authmocks.NewRepository(t)
	authRepo.EXPECT().
		GetByAccessToken(ctx, accessToken).
		Return(session, nil)
	authRepo.EXPECT().Update(ctx, session).Return(nil)
	authRepo.EXPECT().CreateDeviceOTP(ctx, mock.Anything).Return(nil)
	authRepo.EXPECT().
		GetDeviceOTP(ctx, mock.Anything).
		Return(deviceOTP, nil)
	authRepo.EXPECT().GetDeviceOTP(ctx, mock.Anything).Return(deviceOTP, nil)
	authRepo.EXPECT().UpdateDeviceOTP(ctx, deviceOTP).Return(nil)

	appRepo := appmocks.NewRepository(t)
	appRepo.EXPECT().GetApp(ctx, calledApp.ID).Return(calledApp, nil)
	appRepo.EXPECT().
		GetApp(ctx, session.OwnerAppID).
		Return(callerApp, nil)

	policyEva := policymocks.NewEvaluator(t)
	policyEva.EXPECT().
		Evaluate(ctx, calledApp, session.OwnerAppID, "").
		Return(&policytypes.Rule{NeedsApproval: true}, nil)

	device1 := &devicetypes.Device{}
	device2 := &devicetypes.Device{}
	deviceRepo := devicemocks.NewRepository(t)
	deviceRepo.EXPECT().GetDevices(ctx, session.UserID).Return([]*devicetypes.Device{device1, device2}, nil)

	notifServ := bffmocks.NewNotificationService(t)
	notifServ.EXPECT().
		SendOTPNotification(ctx, device2, session, mock.Anything, callerApp, calledApp, mock.Anything).
		Return(nil)
	sut := bff.NewAuthService(authRepo, nil, nil, appRepo, policyEva, deviceRepo, notifServ, nil, nil)

	err := sut.ExtAuthZ(ctx, accessToken, "")

	assert.NoError(t, err)
	assert.True(t, deviceOTP.Used)
}

func TestAuthService_ExtAuthZ_should_return_err_when_no_device_registered_during_human_approval(t *testing.T) {
	t.Parallel()

	accessToken := generateValidJWT(t)
	callerApp := &apptypes.App{ID: uuid.NewString()}
	calledApp := &apptypes.App{ID: uuid.NewString()}
	ctx := identitycontext.InsertAppID(context.Background(), calledApp.ID)
	session := &authtypes.Session{
		OwnerAppID: callerApp.ID,
		UserID:     ptrutil.Ptr(uuid.NewString()),
	}
	authRepo := authmocks.NewRepository(t)
	authRepo.EXPECT().
		GetByAccessToken(ctx, accessToken).
		Return(session, nil)

	appRepo := appmocks.NewRepository(t)
	appRepo.EXPECT().GetApp(ctx, calledApp.ID).Return(calledApp, nil)
	appRepo.EXPECT().
		GetApp(ctx, session.OwnerAppID).
		Return(callerApp, nil)

	policyEva := policymocks.NewEvaluator(t)
	policyEva.EXPECT().
		Evaluate(ctx, calledApp, session.OwnerAppID, "").
		Return(&policytypes.Rule{NeedsApproval: true}, nil)

	deviceRepo := devicemocks.NewRepository(t)
	deviceRepo.EXPECT().GetDevices(ctx, session.UserID).Return(nil, nil)
	sut := bff.NewAuthService(authRepo, nil, nil, appRepo, policyEva, deviceRepo, nil, nil, nil)

	err := sut.ExtAuthZ(ctx, accessToken, "")

	assert.Error(t, err)
	assert.ErrorContains(t, err, "no devices registered")
}

func TestAuthService_ExtAuthZ_should_return_err_when_send_notification_fails(t *testing.T) {
	t.Parallel()

	accessToken := generateValidJWT(t)
	callerApp := &apptypes.App{ID: uuid.NewString()}
	calledApp := &apptypes.App{ID: uuid.NewString()}
	ctx := identitycontext.InsertAppID(context.Background(), calledApp.ID)
	session := &authtypes.Session{
		OwnerAppID: callerApp.ID,
		UserID:     ptrutil.Ptr(uuid.NewString()),
	}
	authRepo := authmocks.NewRepository(t)
	authRepo.EXPECT().
		GetByAccessToken(ctx, accessToken).
		Return(session, nil)
	authRepo.EXPECT().CreateDeviceOTP(ctx, mock.Anything).Return(nil)

	appRepo := appmocks.NewRepository(t)
	appRepo.EXPECT().GetApp(ctx, calledApp.ID).Return(calledApp, nil)
	appRepo.EXPECT().
		GetApp(ctx, session.OwnerAppID).
		Return(callerApp, nil)

	policyEva := policymocks.NewEvaluator(t)
	policyEva.EXPECT().
		Evaluate(ctx, calledApp, session.OwnerAppID, "").
		Return(&policytypes.Rule{NeedsApproval: true}, nil)

	deviceRepo := devicemocks.NewRepository(t)
	deviceRepo.EXPECT().
		GetDevices(ctx, session.UserID).
		Return([]*devicetypes.Device{{}}, nil)

	notifServ := bffmocks.NewNotificationService(t)
	notifServ.EXPECT().
		SendOTPNotification(ctx, mock.Anything, session, mock.Anything, callerApp, calledApp, mock.Anything).
		Return(errors.New("failed"))
	sut := bff.NewAuthService(authRepo, nil, nil, appRepo, policyEva, deviceRepo, notifServ, nil, nil)

	err := sut.ExtAuthZ(ctx, accessToken, "")

	assert.Error(t, err)
	assert.ErrorContains(t, err, "unable to send notification")
}

func TestAuthService_ExtAuthZ_should_return_err_when_device_otp_is_invalid(t *testing.T) {
	t.Parallel()

	testCases := map[string]*authtypes.SessionDeviceOTP{
		"Device OTP is already used": {
			Used: true,
		},
		"Device OTP is already expired": {
			ExpiresAt: time.Now().Add(-time.Second).Unix(),
		},
		"Device OTP is not approved": {
			Approved:  ptrutil.Ptr(false),
			ExpiresAt: time.Now().Add(time.Minute).Unix(),
		},
	}

	for tn, otp := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			accessToken := generateValidJWT(t)
			callerApp := &apptypes.App{ID: uuid.NewString()}
			calledApp := &apptypes.App{ID: uuid.NewString()}
			ctx := identitycontext.InsertAppID(context.Background(), calledApp.ID)
			session := &authtypes.Session{
				OwnerAppID: callerApp.ID,
				UserID:     ptrutil.Ptr(uuid.NewString()),
			}
			authRepo := authmocks.NewRepository(t)
			authRepo.EXPECT().
				GetByAccessToken(ctx, accessToken).
				Return(session, nil)
			authRepo.EXPECT().CreateDeviceOTP(ctx, mock.Anything).Return(nil)
			authRepo.EXPECT().
				GetDeviceOTP(ctx, mock.Anything).
				Return(otp, nil)
			authRepo.EXPECT().GetDeviceOTP(ctx, mock.Anything).Return(otp, nil)
			authRepo.EXPECT().UpdateDeviceOTP(ctx, otp).Return(nil)

			appRepo := appmocks.NewRepository(t)
			appRepo.EXPECT().GetApp(ctx, calledApp.ID).Return(calledApp, nil)
			appRepo.EXPECT().
				GetApp(ctx, session.OwnerAppID).
				Return(callerApp, nil)

			policyEva := policymocks.NewEvaluator(t)
			policyEva.EXPECT().
				Evaluate(ctx, calledApp, session.OwnerAppID, "").
				Return(&policytypes.Rule{NeedsApproval: true}, nil)

			deviceRepo := devicemocks.NewRepository(t)
			deviceRepo.EXPECT().GetDevices(ctx, session.UserID).Return([]*devicetypes.Device{{}}, nil)

			notifServ := bffmocks.NewNotificationService(t)
			notifServ.EXPECT().
				SendOTPNotification(ctx, mock.Anything, session, mock.Anything, callerApp, calledApp, mock.Anything).
				Return(nil)
			sut := bff.NewAuthService(authRepo, nil, nil, appRepo, policyEva, deviceRepo, notifServ, nil, nil)

			err := sut.ExtAuthZ(ctx, accessToken, "")

			assert.Error(t, err)
			assert.ErrorContains(t, err, "the user did not approve the invocation")
		})
	}
}

func generateValidJWT(t *testing.T) string {
	t.Helper()

	priv, _ := joseutil.GenerateJWK("RS256", "sig", "keyId")
	accessToken, _ := oidc.SelfIssueJWT(uuid.NewString(), uuid.NewString(), priv)

	return accessToken
}

// ApproveToken

func TestAuthService_ApproveToken_should_succeed(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	otp := &authtypes.SessionDeviceOTP{
		DeviceID:  uuid.NewString(),
		SessionID: uuid.NewString(),
		Value:     uuid.NewString(),
		ExpiresAt: time.Now().Add(time.Minute).Unix(),
		Used:      false,
	}
	authRepo := authmocks.NewRepository(t)
	authRepo.EXPECT().
		GetDeviceOTPByValue(ctx, otp.DeviceID, otp.SessionID, otp.Value).
		Return(otp, nil)
	authRepo.EXPECT().UpdateDeviceOTP(ctx, otp).Return(nil)
	sut := bff.NewAuthService(authRepo, nil, nil, nil, nil, nil, nil, nil, nil)

	err := sut.ApproveToken(ctx, otp.DeviceID, otp.SessionID, otp.Value, true)

	assert.NoError(t, err)
}

func TestAuthService_ApproveToken_should_fail(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		otp    *authtypes.SessionDeviceOTP
		errMsg string
	}{
		"OTP already expired": {
			otp: &authtypes.SessionDeviceOTP{
				DeviceID:  uuid.NewString(),
				SessionID: uuid.NewString(),
				Value:     uuid.NewString(),
				ExpiresAt: time.Now().Add(-time.Minute).Unix(),
			},
			errMsg: "the OTP is already expired",
		},
		"OTP already used": {
			otp: &authtypes.SessionDeviceOTP{
				DeviceID:  uuid.NewString(),
				SessionID: uuid.NewString(),
				Value:     uuid.NewString(),
				ExpiresAt: time.Now().Add(time.Minute).Unix(),
				Used:      true,
			},
			errMsg: "the OTP is already used",
		},
		"OTP already approved": {
			otp: &authtypes.SessionDeviceOTP{
				DeviceID:  uuid.NewString(),
				SessionID: uuid.NewString(),
				Value:     uuid.NewString(),
				ExpiresAt: time.Now().Add(time.Minute).Unix(),
				Approved:  ptrutil.Ptr(true),
			},
			errMsg: "the OTP is already used",
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			ctx := context.Background()
			authRepo := authmocks.NewRepository(t)
			authRepo.EXPECT().
				GetDeviceOTPByValue(ctx, tc.otp.DeviceID, tc.otp.SessionID, tc.otp.Value).
				Return(tc.otp, nil)
			sut := bff.NewAuthService(authRepo, nil, nil, nil, nil, nil, nil, nil, nil)

			err := sut.ApproveToken(ctx, tc.otp.DeviceID, tc.otp.SessionID, tc.otp.Value, true)

			assert.Error(t, err)
			assert.ErrorContains(t, err, tc.errMsg)
		})
	}
}
