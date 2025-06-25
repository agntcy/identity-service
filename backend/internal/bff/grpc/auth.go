// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Authentifier: Apache-2.0

package grpc

import (
	"context"

	identity_platform_sdk_go "github.com/agntcy/identity-platform/api/server/agntcy/identity/platform/v1alpha1"
	"github.com/agntcy/identity-platform/internal/bff"
	"github.com/agntcy/identity-platform/internal/bff/grpc/converters"
	identitycontext "github.com/agntcy/identity-platform/internal/pkg/context"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/internal/pkg/grpcutil"
	"github.com/agntcy/identity-platform/internal/pkg/ptrutil"
	"google.golang.org/protobuf/types/known/emptypb"
)

type authService struct {
	authSrv bff.AuthService
	appSrv  bff.AppService
}

func NewAuthService(
	authSrv bff.AuthService,
	appSrv bff.AppService,
) identity_platform_sdk_go.AuthServiceServer {
	return &authService{
		authSrv: authSrv,
		appSrv:  appSrv,
	}
}

func (s *authService) AppInfo(
	ctx context.Context,
	req *emptypb.Empty,
) (*identity_platform_sdk_go.AppInfoResponse, error) {
	if ctx == nil {
		return nil, errutil.Err(
			nil,
			"request context is empty",
		)
	}

	// Get app ID from context
	appID, ok := identitycontext.GetAppID(ctx)
	if !ok || appID == "" {
		return nil, errutil.Err(
			nil,
			"app ID not found in context",
		)
	}

	// Get app info from the app service
	app, err := s.appSrv.GetApp(ctx, appID)
	if err != nil {
		return nil, errutil.Err(
			err,
			"failed to get app info",
		)
	}

	return &identity_platform_sdk_go.AppInfoResponse{
		App: converters.FromApp(app),
	}, nil
}

func (s *authService) Authorize(
	ctx context.Context,
	req *identity_platform_sdk_go.AuthorizeRequest,
) (*identity_platform_sdk_go.AuthorizeResponse, error) {
	session, err := s.authSrv.Authorize(
		ctx,
		req.AppId,
		req.ToolName,
		req.UserToken,
	)
	if err != nil {
		return nil, errutil.Err(
			err,
			"failed to authorize",
		)
	}

	return &identity_platform_sdk_go.AuthorizeResponse{
		AuthorizationCode: ptrutil.DerefStr(session.AuthorizationCode),
	}, nil
}

func (s *authService) Token(
	ctx context.Context,
	req *identity_platform_sdk_go.TokenRequest,
) (*identity_platform_sdk_go.TokenResponse, error) {
	if req.AuthorizationCode == "" {
		return nil, grpcutil.BadRequestError(
			errutil.Err(
				nil,
				"authorization code cannot be empty",
			),
		)
	}

	// Get the session with token
	session, err := s.authSrv.Token(
		ctx,
		req.AuthorizationCode,
	)
	if err != nil {
		return nil, grpcutil.UnauthorizedError(
			errutil.Err(
				err,
				"failed to issue token",
			),
		)
	}

	return &identity_platform_sdk_go.TokenResponse{
		AccessToken: ptrutil.DerefStr(session.AccessToken),
	}, nil
}

func (s *authService) ExtAuthz(
	ctx context.Context,
	req *emptypb.Empty,
) (*emptypb.Empty, error) {
	return nil, errutil.Err(
		nil,
		"ExtAuthz method is not implemented",
	)
}

func (s *authService) RegisterDevice(
	ctx context.Context,
	req *identity_platform_sdk_go.RegisterDeviceRequest,
) (*emptypb.Empty, error) {
	return nil, errutil.Err(
		nil,
		"RegisterDevice method is not implemented",
	)
}
