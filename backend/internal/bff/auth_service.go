// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Authentifier: Apache-2.0

package bff

import (
	"context"
	"time"

	appcore "github.com/agntcy/identity-platform/internal/core/app"
	authcore "github.com/agntcy/identity-platform/internal/core/auth"
	authtypes "github.com/agntcy/identity-platform/internal/core/auth/types"
	idpcore "github.com/agntcy/identity-platform/internal/core/idp"
	policycore "github.com/agntcy/identity-platform/internal/core/policy"
	identitycontext "github.com/agntcy/identity-platform/internal/pkg/context"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/internal/pkg/jwtutil"
	"github.com/agntcy/identity-platform/internal/pkg/ptrutil"
	"github.com/agntcy/identity/pkg/oidc"
)

type AuthService interface {
	Authorize(
		ctx context.Context,
		appID, toolName, userToken *string,
	) (*authtypes.Session, error)
	Token(
		ctx context.Context,
		authorizationCode string,
	) (*authtypes.Session, error)
	ExtAuthZ(
		ctx context.Context,
		accessToken string,
		toolName string,
	) error
}

type authService struct {
	authRepository    authcore.Repository
	credentialStore   idpcore.CredentialStore
	oidcAuthenticator oidc.Authenticator
	appRepository     appcore.Repository
	policyEvaluator   policycore.Evaluator
}

func NewAuthService(
	authRepository authcore.Repository,
	credentialStore idpcore.CredentialStore,
	oidcAuthenticator oidc.Authenticator,
	appRepository appcore.Repository,
	policyEvaluator policycore.Evaluator,
) AuthService {
	return &authService{
		authRepository:    authRepository,
		credentialStore:   credentialStore,
		oidcAuthenticator: oidcAuthenticator,
		appRepository:     appRepository,
		policyEvaluator:   policyEvaluator,
	}
}

func (s *authService) Authorize(
	ctx context.Context,
	appID, toolName, _ *string,
) (*authtypes.Session, error) {
	// Get calling identity from context
	ownerAppID, ok := identitycontext.GetAppID(ctx)
	if !ok || ownerAppID == "" {
		return nil, errutil.Err(
			nil,
			"app ID not found in context",
		)
	}

	if appID != nil && *appID == ownerAppID {
		return nil, errutil.Err(
			nil,
			"cannot authorize the same app",
		)
	}

	_, err := s.appRepository.GetApp(ctx, ownerAppID)
	if err != nil {
		return nil, errutil.Err(err, "app not found")
	}

	// When appID is not provided, it means the session is for all apps
	// Policy will be evaluated on the external authorization step
	if appID != nil && *appID != "" {
		app, err := s.appRepository.GetApp(ctx, *appID)
		if err != nil {
			return nil, errutil.Err(err, "app not found")
		}

		// Evaluate the session based on existing policies
		err = s.policyEvaluator.Evaluate(ctx, app, ownerAppID, ptrutil.DerefStr(toolName))
		if err != nil {
			return nil, err
		}
	}

	// Create new session
	session, err := s.authRepository.Create(ctx, &authtypes.Session{
		OwnerAppID: ownerAppID,
		AppID:      appID,
		ToolName:   toolName,
	})
	if err != nil {
		return nil, errutil.Err(
			err,
			"failed to create session",
		)
	}

	return session, nil
}

func (s *authService) Token(
	ctx context.Context,
	authorizationCode string,
) (*authtypes.Session, error) {
	if authorizationCode == "" {
		return nil, errutil.Err(
			nil,
			"authorization code cannot be empty",
		)
	}

	// Get session by authorization code
	session, err := s.authRepository.GetByAuthorizationCode(ctx, authorizationCode)
	if err != nil {
		return nil, errutil.Err(
			err,
			"invalid session",
		)
	}

	// Check if session already has an access token
	if session.AccessToken != nil {
		return nil, errutil.Err(
			nil,
			"a token has already been issued",
		)
	}

	// Get client credentials from the session
	clientCredentials, err := s.credentialStore.Get(ctx, session.OwnerAppID)
	if err != nil || clientCredentials == nil {
		return nil, errutil.Err(
			err,
			"failed to get client credentials",
		)
	}

	// Issue a token
	accessToken, err := s.oidcAuthenticator.Token(
		ctx,
		clientCredentials.Issuer,
		clientCredentials.ClientID,
		clientCredentials.ClientSecret,
	)
	if err != nil {
		return nil, errutil.Err(
			err,
			"failed to issue token",
		)
	}

	// Update session with token ID
	session.AccessToken = ptrutil.Ptr(accessToken)

	err = s.authRepository.Update(ctx, session)
	if err != nil {
		return nil, errutil.Err(
			err,
			"failed to update the session",
		)
	}

	return session, nil
}

func (s *authService) ExtAuthZ(
	ctx context.Context,
	accessToken string,
	toolName string,
) error {
	// TODO:
	// - verify correctly the JWT (expiration date)
	// - check the self issued one with the generated keys

	if accessToken == "" {
		return errutil.Err(
			nil,
			"access token cannot be empty",
		)
	}

	session, err := s.authRepository.GetByAccessToken(ctx, accessToken)
	if err != nil {
		return errutil.Err(
			err,
			"invalid session",
		)
	}

	appID, _ := identitycontext.GetAppID(ctx)

	app, err := s.appRepository.GetApp(ctx, appID)
	if err != nil {
		return errutil.Err(err, "app not found")
	}

	// If the session appID is provided (in the authorize call)
	// it needs to match the current context appID
	if session.AppID != nil && appID != "" && *session.AppID != appID {
		return errutil.Err(
			nil,
			"access token is not valid for the specified app",
		)
	}

	// If the session toolName is provided (in the authorize call)
	// we cannot specify another toolName in the ext-authz request
	if session.ToolName != nil && toolName != "" && *session.ToolName != toolName {
		return errutil.Err(
			nil,
			"access token is not valid for the specified tool",
		)
	}

	// Validate expiration of the access token
	err = jwtutil.Verify(accessToken)
	if err != nil {
		return err
	}

	if toolName == "" {
		toolName = ptrutil.DerefStr(session.ToolName)
	}

	// Evaluate the session based on existing policies
	// Evaluate based on provided appID and toolName and the session appID, toolName
	err = s.policyEvaluator.Evaluate(ctx, app, session.OwnerAppID, toolName)
	if err != nil {
		return err
	}

	// Expire the session
	session.ExpiresAt = ptrutil.Ptr(time.Now().Add(-time.Hour).Unix())

	return err
}
