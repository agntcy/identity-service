// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Authentifier: Apache-2.0

package bff

import (
	"context"

	authcore "github.com/agntcy/identity-platform/internal/core/auth"
	"github.com/agntcy/identity-platform/internal/core/auth/types"
	authtypes "github.com/agntcy/identity-platform/internal/core/auth/types"
	idpcore "github.com/agntcy/identity-platform/internal/core/idp"
	identitycontext "github.com/agntcy/identity-platform/internal/pkg/context"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/internal/pkg/grpcutil"
	"github.com/agntcy/identity-platform/internal/pkg/ptrutil"
	"github.com/agntcy/identity/pkg/oidc"
)

type AuthService interface {
	Authorize(
		ctx context.Context,
		appID string,
		toolName, userToken *string,
	) (*authtypes.Session, error)
	Token(
		ctx context.Context,
		authorizationCode string,
	) (*authtypes.Session, error)
}

type authService struct {
	authRepository    authcore.Repository
	credentialStore   idpcore.CredentialStore
	oidcAuthenticator oidc.Authenticator
}

func NewAuthService(
	authRepository authcore.Repository,
	credentialStore idpcore.CredentialStore,
	oidcAuthenticator oidc.Authenticator,
) AuthService {
	return &authService{
		authRepository:    authRepository,
		credentialStore:   credentialStore,
		oidcAuthenticator: oidcAuthenticator,
	}
}

func (s *authService) Authorize(
	ctx context.Context,
	appID string,
	toolName, _ *string,
) (*authtypes.Session, error) {
	if appID == "" {
		return nil, errutil.Err(
			nil,
			"app ID cannot be empty",
		)
	}

	// Get calling identity from context
	ownerAppID, ok := identitycontext.GetAppID(ctx)
	if !ok || ownerAppID == "" {
		return nil, errutil.Err(
			nil,
			"app ID not found in context",
		)
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
) (*types.Session, error) {
	if authorizationCode == "" {
		return nil, errutil.Err(
			nil,
			"authorization code cannot be empty",
		)
	}

	// Get session by authorization code
	session, err := s.authRepository.GetByAuthorizationCode(ctx, authorizationCode)
	if err != nil {
		return nil, grpcutil.BadRequestError(errutil.Err(
			err,
			"invalid session",
		))
	}

	// Check if session already has an access token
	if session.AccessToken != nil {
		return nil, grpcutil.BadRequestError(errutil.Err(
			nil,
			"a token has already been issued",
		))
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
		return nil, grpcutil.UnauthorizedError(errutil.Err(
			err,
			"failed to issue token",
		))
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
