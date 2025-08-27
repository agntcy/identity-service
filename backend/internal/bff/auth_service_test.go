// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Appentifier: Apache-2.0

package bff_test

import (
	"context"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/outshift/identity-service/internal/bff"
	appmocks "github.com/outshift/identity-service/internal/core/app/mocks"
	apptypes "github.com/outshift/identity-service/internal/core/app/types"
	authmocks "github.com/outshift/identity-service/internal/core/auth/mocks"
	authtypes "github.com/outshift/identity-service/internal/core/auth/types/int"
	policymocks "github.com/outshift/identity-service/internal/core/policy/mocks"
	policytypes "github.com/outshift/identity-service/internal/core/policy/types"
	identitycontext "github.com/outshift/identity-service/internal/pkg/context"
	"github.com/outshift/identity-service/internal/pkg/ptrutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestAuthService_Authorize_should_generate_auth_code(t *testing.T) {
	t.Parallel()

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
	t.Parallel()

	ownerAppID := "owner-app-id"
	calledApp := &apptypes.App{ID: "specific-app-id"}
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
		Return(calledApp, nil)
	policyEvaluator := policymocks.NewEvaluator(t)
	policyEvaluator.EXPECT().
		Evaluate(mock.Anything, calledApp, ownerAppID, "").
		Return(&policytypes.Rule{}, nil)
	sut := bff.NewAuthService(authRepo, nil, nil, appRepo, policyEvaluator, nil, nil, nil, nil)

	session, err := sut.Authorize(ctx, &resolverMetadataID, nil, nil)

	assert.NoError(t, err)
	assert.NotEmpty(t, session.AuthorizationCode)
	assert.Greater(t, *session.ExpiresAt, time.Now().Unix())
}

func TestAuthService_Authorize_should_generate_session_for_tool(t *testing.T) {
	t.Parallel()

	ownerAppID := "owner-app-id"
	calledApp := &apptypes.App{ID: "specific-app-id"}
	resolverMetadataID := "resolver-metadata-id"
	toolName := "cool_tool"
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
		Return(calledApp, nil)
	policyEvaluator := policymocks.NewEvaluator(t)
	policyEvaluator.EXPECT().
		Evaluate(mock.Anything, calledApp, ownerAppID, toolName).
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

	ownerAppID := "owner-app-id"
	invalidResolverMD := "invalid"
	ctx := identitycontext.InsertAppID(context.Background(), ownerAppID)
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

	ownerAppID := "owner-app-id"
	invalidCalledApp := &apptypes.App{ID: ownerAppID}
	resolverMetadataID := "resolver-metadata-id"
	ctx := identitycontext.InsertAppID(context.Background(), ownerAppID)
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

	invalidOwnerAppID := "owner-app-id"
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

	ownerAppID := "owner-app-id"
	calledApp := &apptypes.App{ID: "specific-app-id"}
	resolverMetadataID := "resolver-metadata-id"
	ctx := identitycontext.InsertAppID(context.Background(), ownerAppID)
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
		Evaluate(mock.Anything, calledApp, ownerAppID, "").
		Return(nil, errors.New("invalid evaluation"))
	sut := bff.NewAuthService(nil, nil, nil, appRepo, policyEvaluator, nil, nil, nil, nil)

	_, err := sut.Authorize(ctx, &resolverMetadataID, nil, nil)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "invalid evaluation")
}
