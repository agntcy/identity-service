// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Authentifier: Apache-2.0

package bff

import (
	"context"

	authcore "github.com/agntcy/identity-platform/internal/core/auth"
	authtypes "github.com/agntcy/identity-platform/internal/core/auth/types"
	identitycontext "github.com/agntcy/identity-platform/internal/pkg/context"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
)

type AuthService interface {
	Authorize(
		ctx context.Context,
		appID string,
		toolName, userToken *string,
	) (*authtypes.Session, error)
}

type authService struct {
	authRepository authcore.Repository
}

func NewAuthService(
	authRepository authcore.Repository,
) AuthService {
	return &authService{
		authRepository: authRepository,
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
