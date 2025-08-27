// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Appentifier: Apache-2.0

package bff_test

import (
	"context"
	"testing"
	"time"

	"github.com/outshift/identity-service/internal/bff"
	appmocks "github.com/outshift/identity-service/internal/core/app/mocks"
	apptypes "github.com/outshift/identity-service/internal/core/app/types"
	authmocks "github.com/outshift/identity-service/internal/core/auth/mocks"
	authtypes "github.com/outshift/identity-service/internal/core/auth/types/int"
	identitycontext "github.com/outshift/identity-service/internal/pkg/context"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestAuthService_Authorize_should_generate_auth_code(t *testing.T) {
	ownerAppID := "owner-app-id"
	ctx := identitycontext.InsertAppID(context.Background(), ownerAppID)
	authRepo := authmocks.NewRepository(t)
	authRepo.EXPECT().
		Create(mock.Anything, mock.Anything).
		RunAndReturn(func(_ context.Context, s *authtypes.Session) (*authtypes.Session, error) {
			return s, nil
		})
	appRepo := appmocks.NewRepository(t)
	appRepo.EXPECT().
		GetApp(mock.Anything, mock.Anything).
		Return(&apptypes.App{ID: ownerAppID}, nil)
	sut := bff.NewAuthService(authRepo, nil, nil, appRepo, nil, nil, nil, nil, nil)

	session, err := sut.Authorize(ctx, nil, nil, nil)

	assert.NoError(t, err)
	assert.NotEmpty(t, session.AuthorizationCode)
	assert.Greater(t, *session.ExpiresAt, time.Now().Unix())
}

func TestAuthService_Authorize_should_generate_auth_code_for_specific_app(t *testing.T) {
	ownerAppID := "owner-app-id"
	appID := "specific-app-id"
	resolverMetadataID := "resolver-metadata-id"
	ctx := identitycontext.InsertAppID(context.Background(), ownerAppID)
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
		Return(&apptypes.App{ID: appID}, nil)

	sut := bff.NewAuthService(authRepo, nil, nil, appRepo, nil, nil, nil, nil, nil)

	session, err := sut.Authorize(ctx, &resolverMetadataID, nil, nil)

	assert.NoError(t, err)
	assert.NotEmpty(t, session.AuthorizationCode)
	assert.Greater(t, *session.ExpiresAt, time.Now().Unix())
}
