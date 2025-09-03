// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package interceptors_test

import (
	"context"
	"errors"
	"fmt"
	"testing"

	"github.com/google/uuid"
	identity_service_sdk_go "github.com/outshift/identity-service/api/server/outshift/identity/service/v1alpha1"
	outshiftiammocks "github.com/outshift/identity-service/internal/pkg/iam/mocks"
	"github.com/outshift/identity-service/internal/pkg/interceptors"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

type mockHandler struct {
	mock.Mock
}

func (m *mockHandler) Handle(ctx context.Context, req any) (any, error) {
	args := m.Called(ctx, req)
	return args.Get(0), args.Error(1)
}

func TestAuthInterceptor_Unary_should_allow_services_without_auth(t *testing.T) {
	t.Parallel()

	testCases := []string{
		identity_service_sdk_go.DeviceService_RegisterDevice_FullMethodName,
		identity_service_sdk_go.BadgeService_VerifyBadge_FullMethodName,
		identity_service_sdk_go.AuthService_ApproveToken_FullMethodName,
		"/grpc.health.v1.Health/Check",
	}

	for _, tc := range testCases {
		t.Run(fmt.Sprintf("should allow %s", tc), func(t *testing.T) {
			t.Parallel()

			ctx := context.Background()
			handler := mockHandler{}
			handler.On("Handle", ctx, mock.Anything).Return(nil, nil)
			sut := interceptors.NewAuthInterceptor(nil, "")

			_, err := sut.Unary(ctx, nil, &grpc.UnaryServerInfo{
				FullMethod: tc,
			}, handler.Handle)

			assert.NoError(t, err)
			handler.AssertExpectations(t)
		})
	}
}

func TestAuthInterceptor_Unary_should_validate_jwt(t *testing.T) {
	t.Parallel()

	jwt := uuid.NewString()
	ctx := metadata.NewIncomingContext(context.Background(), metadata.MD{
		interceptors.AuthorizationHeaderKey: []string{jwt},
	})

	handler := mockHandler{}
	handler.On("Handle", ctx, mock.Anything).Return(nil, nil)

	iamClient := outshiftiammocks.NewClient(t)
	iamClient.EXPECT().AuthJwt(ctx, jwt).Return(ctx, nil)

	sut := interceptors.NewAuthInterceptor(iamClient, "")

	_, err := sut.Unary(ctx, nil, &grpc.UnaryServerInfo{
		FullMethod: uuid.NewString(),
	}, handler.Handle)

	assert.NoError(t, err)
}

func TestAuthInterceptor_Unary_should_validate_api_key(t *testing.T) {
	t.Parallel()

	testCases := []*struct {
		fullMethod     string
		allowedForApps bool
	}{
		{
			fullMethod:     uuid.NewString(),
			allowedForApps: false,
		},
		{
			fullMethod:     identity_service_sdk_go.AuthService_AppInfo_FullMethodName,
			allowedForApps: true,
		},
		{
			fullMethod:     identity_service_sdk_go.AuthService_Authorize_FullMethodName,
			allowedForApps: true,
		},
		{
			fullMethod:     identity_service_sdk_go.AuthService_Token_FullMethodName,
			allowedForApps: true,
		},
		{
			fullMethod:     identity_service_sdk_go.AuthService_ExtAuthz_FullMethodName,
			allowedForApps: true,
		},
		{
			fullMethod:     identity_service_sdk_go.BadgeService_IssueBadge_FullMethodName,
			allowedForApps: true,
		},
	}

	for _, tc := range testCases {
		t.Run(
			fmt.Sprintf("validate API Key for %s, allowed for apps = %t", tc.fullMethod, tc.allowedForApps),
			func(t *testing.T) {
				t.Parallel()

				apiKey := uuid.NewString()
				productID := uuid.NewString()
				ctx := metadata.NewIncomingContext(context.Background(), metadata.MD{
					interceptors.ApiKeyHeaderKey: []string{apiKey},
				})

				handler := mockHandler{}
				handler.On("Handle", ctx, mock.Anything).Return(nil, nil)

				iamClient := outshiftiammocks.NewClient(t)
				iamClient.EXPECT().AuthApiKey(ctx, productID, apiKey, tc.allowedForApps).Return(ctx, nil)

				sut := interceptors.NewAuthInterceptor(iamClient, productID)

				_, err := sut.Unary(ctx, nil, &grpc.UnaryServerInfo{
					FullMethod: tc.fullMethod,
				}, handler.Handle)

				assert.NoError(t, err)
			},
		)
	}
}

func TestAuthInterceptor_Unary_should_return_unauthorized(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		configureIamClient func(t *testing.T, client *outshiftiammocks.Client)
		md                 metadata.MD
		fullMethod         string
	}{
		"request with JWT": {
			configureIamClient: func(t *testing.T, client *outshiftiammocks.Client) {
				t.Helper()

				client.EXPECT().
					AuthJwt(mock.Anything, mock.Anything).
					Return(context.Background(), errors.New("invalid"))
			},
			md: metadata.MD{
				interceptors.AuthorizationHeaderKey: []string{uuid.NewString()},
			},
			fullMethod: uuid.NewString(),
		},
		"request with user API Key": {
			configureIamClient: func(t *testing.T, client *outshiftiammocks.Client) {
				t.Helper()

				client.EXPECT().
					AuthApiKey(mock.Anything, mock.Anything, mock.Anything, false).
					Return(context.Background(), errors.New("invalid"))
			},
			md: metadata.MD{
				interceptors.ApiKeyHeaderKey: []string{uuid.NewString()},
			},
			fullMethod: uuid.NewString(),
		},
		"request with app API Key": {
			configureIamClient: func(t *testing.T, client *outshiftiammocks.Client) {
				t.Helper()

				client.EXPECT().
					AuthApiKey(mock.Anything, mock.Anything, mock.Anything, true).
					Return(context.Background(), errors.New("invalid"))
			},
			md: metadata.MD{
				interceptors.ApiKeyHeaderKey: []string{uuid.NewString()},
			},
			fullMethod: identity_service_sdk_go.AuthService_Authorize_FullMethodName,
		},
		"request without auth headers": {
			configureIamClient: func(t *testing.T, client *outshiftiammocks.Client) {
				t.Helper()
			},
			md:         metadata.MD{},
			fullMethod: uuid.NewString(),
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			ctx := metadata.NewIncomingContext(context.Background(), tc.md)

			iamClient := outshiftiammocks.NewClient(t)
			tc.configureIamClient(t, iamClient)

			sut := interceptors.NewAuthInterceptor(iamClient, "")

			_, err := sut.Unary(ctx, nil, &grpc.UnaryServerInfo{
				FullMethod: tc.fullMethod,
			}, nil)

			assert.Error(t, err)

			st := status.Convert(err)
			assert.NotNil(t, st)
			assert.Equal(t, codes.Unauthenticated, st.Code())
		})
	}
}

func TestAuthInterceptor_Unary_should_return_err_when_ctx_does_not_have_metadata(t *testing.T) {
	t.Parallel()

	invalidCtx := context.Background()

	sut := interceptors.NewAuthInterceptor(nil, "")

	_, err := sut.Unary(invalidCtx, nil, &grpc.UnaryServerInfo{}, nil)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed to extract metadata from context")
}
