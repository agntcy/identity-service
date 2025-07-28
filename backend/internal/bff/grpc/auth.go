// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Authentifier: Apache-2.0

package grpc

import (
	"context"

	identity_service_sdk_go "github.com/agntcy/identity-service/api/server/agntcy/identity/service/v1alpha1"
	"github.com/agntcy/identity-service/internal/bff"
	"github.com/agntcy/identity-service/internal/bff/grpc/converters"
	identitycontext "github.com/agntcy/identity-service/internal/pkg/context"
	"github.com/agntcy/identity-service/internal/pkg/errutil"
	"github.com/agntcy/identity-service/internal/pkg/grpcutil"
	"github.com/agntcy/identity-service/internal/pkg/ptrutil"
	"google.golang.org/protobuf/types/known/emptypb"
)

type authService struct {
	authSrv bff.AuthService
	appSrv  bff.AppService
}

func NewAuthService(
	authSrv bff.AuthService,
	appSrv bff.AppService,
) identity_service_sdk_go.AuthServiceServer {
	return &authService{
		authSrv: authSrv,
		appSrv:  appSrv,
	}
}

func (s *authService) AppInfo(
	ctx context.Context,
	req *emptypb.Empty,
) (*identity_service_sdk_go.AppInfoResponse, error) {
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

	return &identity_service_sdk_go.AppInfoResponse{
		App: converters.FromApp(app),
	}, nil
}

func (s *authService) Authorize(
	ctx context.Context,
	req *identity_service_sdk_go.AuthorizeRequest,
) (*identity_service_sdk_go.AuthorizeResponse, error) {
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

	return &identity_service_sdk_go.AuthorizeResponse{
		AuthorizationCode: ptrutil.DerefStr(session.AuthorizationCode),
	}, nil
}

func (s *authService) Token(
	ctx context.Context,
	req *identity_service_sdk_go.TokenRequest,
) (*identity_service_sdk_go.TokenResponse, error) {
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

	return &identity_service_sdk_go.TokenResponse{
		AccessToken: ptrutil.DerefStr(session.AccessToken),
	}, nil
}

func (s *authService) ExtAuthz(
	ctx context.Context,
	req *identity_service_sdk_go.ExtAuthzRequest,
) (*emptypb.Empty, error) {
	err := s.authSrv.ExtAuthZ(
		ctx,
		req.AccessToken,
		req.GetToolName(),
	)
	if err != nil {
		return nil, grpcutil.UnauthorizedError(errutil.Err(
			nil,
			"failed to authorize",
		))
	}

	return &emptypb.Empty{}, nil
}

func (s *authService) ApproveToken(
	ctx context.Context,
	req *identity_service_sdk_go.ApproveTokenRequest,
) (*emptypb.Empty, error) {
	err := s.authSrv.ApproveToken(
		ctx,
		req.GetDeviceId(),
		req.GetSessionId(),
		req.GetOtp(),
		req.GetApprove(),
	)
	if err != nil {
		return nil, grpcutil.InternalError(errutil.Err(nil, "failed to approve token"))
	}

	return &emptypb.Empty{}, nil
}
