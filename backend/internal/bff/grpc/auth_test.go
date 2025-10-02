// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Appentifier: Apache-2.0

package grpc_test

import (
	"context"
	"errors"
	"testing"

	identity_service_sdk_go "github.com/agntcy/identity-service/api/server/agntcy/identity/service/v1alpha1"
	"github.com/agntcy/identity-service/internal/bff/grpc"
	bffmocks "github.com/agntcy/identity-service/internal/bff/mocks"
	apptypes "github.com/agntcy/identity-service/internal/core/app/types"
	authtypes "github.com/agntcy/identity-service/internal/core/auth/types/int"
	identitycontext "github.com/agntcy/identity-service/internal/pkg/context"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

var errAuthUnexpected = errors.New("failed")

func TestAuthService_AppInfo_should_succeed(t *testing.T) {
	t.Parallel()

	appID := uuid.NewString()
	ctx := identitycontext.InsertAppID(context.Background(), appID)

	appSrv := bffmocks.NewAppService(t)
	appSrv.EXPECT().GetApp(ctx, appID).Return(&apptypes.App{}, nil)

	sut := grpc.NewAuthService(nil, appSrv)

	ret, err := sut.AppInfo(ctx, nil)

	assert.NoError(t, err)
	assert.NotNil(t, ret)
}

func TestAuthService_AppInfo_should_return_error_when_context_does_not_have_app_id(t *testing.T) {
	t.Parallel()

	ctxWithoutAppID := context.Background()

	sut := grpc.NewAuthService(nil, nil)

	_, err := sut.AppInfo(ctxWithoutAppID, nil)

	assert.ErrorIs(t, err, identitycontext.ErrAppNotFound)
}

func TestAuthService_AppInfo_should_propagate_error_when_core_service_fails(t *testing.T) {
	t.Parallel()

	appID := uuid.NewString()
	ctx := identitycontext.InsertAppID(context.Background(), appID)

	appSrv := bffmocks.NewAppService(t)
	appSrv.EXPECT().GetApp(ctx, appID).Return(nil, errAuthUnexpected)

	sut := grpc.NewAuthService(nil, appSrv)

	_, err := sut.AppInfo(ctx, nil)

	assert.ErrorIs(t, err, errAuthUnexpected)
}

func TestAuthService_Authorize_should_succeed(t *testing.T) {
	t.Parallel()

	resolverMetaDataID := uuid.NewString()
	toolName := uuid.NewString()
	userToken := uuid.NewString()
	authCode := uuid.NewString()

	authSrv := bffmocks.NewAuthService(t)
	authSrv.EXPECT().
		Authorize(t.Context(), &resolverMetaDataID, &toolName, &userToken).
		Return(&authtypes.Session{AuthorizationCode: &authCode}, nil)

	sut := grpc.NewAuthService(authSrv, nil)

	ret, err := sut.Authorize(t.Context(), &identity_service_sdk_go.AuthorizeRequest{
		ResolverMetadataId: &resolverMetaDataID,
		ToolName:           &toolName,
		UserToken:          &userToken,
	})

	assert.NoError(t, err)
	assert.Equal(t, authCode, ret.AuthorizationCode)
}

func TestAuthService_Authorize_should_propagate_error_when_core_service_fails(t *testing.T) {
	t.Parallel()

	authSrv := bffmocks.NewAuthService(t)
	authSrv.EXPECT().
		Authorize(t.Context(), mock.Anything, mock.Anything, mock.Anything).
		Return(nil, errAuthUnexpected)

	sut := grpc.NewAuthService(authSrv, nil)

	_, err := sut.Authorize(t.Context(), &identity_service_sdk_go.AuthorizeRequest{})

	assert.ErrorIs(t, err, errAuthUnexpected)
}

func TestAuthService_Token_should_succeed(t *testing.T) {
	t.Parallel()

	authCode := uuid.NewString()
	accessToken := uuid.NewString()

	authSrv := bffmocks.NewAuthService(t)
	authSrv.EXPECT().Token(t.Context(), authCode).Return(&authtypes.Session{AccessToken: &accessToken}, nil)

	sut := grpc.NewAuthService(authSrv, nil)

	ret, err := sut.Token(t.Context(), &identity_service_sdk_go.TokenRequest{AuthorizationCode: authCode})

	assert.NoError(t, err)
	assert.Equal(t, accessToken, ret.AccessToken)
}

func TestAuthService_Token_should_propagate_when_core_service_fails(t *testing.T) {
	t.Parallel()

	authSrv := bffmocks.NewAuthService(t)
	authSrv.EXPECT().Token(t.Context(), mock.Anything).Return(nil, errAuthUnexpected)

	sut := grpc.NewAuthService(authSrv, nil)

	_, err := sut.Token(t.Context(), &identity_service_sdk_go.TokenRequest{AuthorizationCode: uuid.NewString()})

	assert.ErrorIs(t, err, errAuthUnexpected)
}

func TestAuthService_ExtAuthz_should_succeed(t *testing.T) {
	t.Parallel()

	accessToken := uuid.NewString()
	toolName := uuid.NewString()

	authSrv := bffmocks.NewAuthService(t)
	authSrv.EXPECT().ExtAuthZ(t.Context(), accessToken, toolName).Return(nil)

	sut := grpc.NewAuthService(authSrv, nil)

	_, err := sut.ExtAuthz(t.Context(), &identity_service_sdk_go.ExtAuthzRequest{
		AccessToken: accessToken,
		ToolName:    &toolName,
	})

	assert.NoError(t, err)
}

func TestAuthService_ExtAuthz_should_propagate_when_core_service_fails(t *testing.T) {
	t.Parallel()

	authSrv := bffmocks.NewAuthService(t)
	authSrv.EXPECT().ExtAuthZ(t.Context(), mock.Anything, mock.Anything).Return(errAuthUnexpected)

	sut := grpc.NewAuthService(authSrv, nil)

	_, err := sut.ExtAuthz(t.Context(), &identity_service_sdk_go.ExtAuthzRequest{
		AccessToken: uuid.NewString(),
	})

	assert.ErrorIs(t, err, errAuthUnexpected)
}

func TestAuthService_ApproveToken_should_succeed(t *testing.T) {
	t.Parallel()

	deviceID := uuid.NewString()
	sessionID := uuid.NewString()
	otp := uuid.NewString()
	approve := true

	authSrv := bffmocks.NewAuthService(t)
	authSrv.EXPECT().ApproveToken(t.Context(), deviceID, sessionID, otp, approve).Return(nil)

	sut := grpc.NewAuthService(authSrv, nil)

	_, err := sut.ApproveToken(t.Context(), &identity_service_sdk_go.ApproveTokenRequest{
		DeviceId:  deviceID,
		SessionId: sessionID,
		Otp:       otp,
		Approve:   approve,
	})

	assert.NoError(t, err)
}

func TestAuthService_ApproveToken_should_propagate_error_when_core_service_fails(t *testing.T) {
	t.Parallel()

	authSrv := bffmocks.NewAuthService(t)
	authSrv.EXPECT().
		ApproveToken(t.Context(), mock.Anything, mock.Anything, mock.Anything, mock.Anything).
		Return(errAuthUnexpected)

	sut := grpc.NewAuthService(authSrv, nil)

	_, err := sut.ApproveToken(t.Context(), &identity_service_sdk_go.ApproveTokenRequest{})

	assert.ErrorIs(t, err, errAuthUnexpected)
}
