// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Appentifier: Apache-2.0

package grpc

import (
	"context"

	identity_platform_sdk_go "github.com/agntcy/identity-platform/api/server/agntcy/identity/platform/v1alpha1"
	"github.com/agntcy/identity-platform/internal/bff"
	"github.com/agntcy/identity-platform/internal/bff/grpc/converters"
	apptypes "github.com/agntcy/identity-platform/internal/core/app/types"
	"github.com/agntcy/identity-platform/internal/pkg/convertutil"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/internal/pkg/grpcutil"
	"github.com/agntcy/identity-platform/internal/pkg/pagination"
	"github.com/agntcy/identity-platform/internal/pkg/ptrutil"
	"google.golang.org/protobuf/types/known/emptypb"
)

const defaultPageSize int32 = 20

type appService struct {
	appSrv bff.AppService
}

func NewAppService(appSrv bff.AppService) identity_platform_sdk_go.AppServiceServer {
	return &appService{
		appSrv: appSrv,
	}
}

func (s *appService) CreateApp(
	ctx context.Context,
	req *identity_platform_sdk_go.CreateAppRequest,
) (*identity_platform_sdk_go.App, error) {
	app := converters.ToApp(req.GetApp())
	if app == nil {
		return nil, errutil.Err(nil, "app cannot be nil")
	}

	createdApp, err := s.appSrv.CreateApp(ctx, app)
	if err != nil {
		return nil, err
	}

	return converters.FromApp(createdApp), nil
}

func (s *appService) ListApps(
	ctx context.Context,
	req *identity_platform_sdk_go.ListAppsRequest,
) (*identity_platform_sdk_go.ListAppsResponse, error) {
	paginationFilter := pagination.PaginationFilter{
		Page:        req.Page,
		Size:        req.Size,
		DefaultSize: defaultPageSize,
	}
	var appType *apptypes.AppType
	if req.Type != nil {
		appType = ptrutil.Ptr(apptypes.AppType(*req.Type))
	}

	apps, err := s.appSrv.ListApps(ctx, paginationFilter, req.Query, appType)
	if err != nil {
		return nil, grpcutil.BadRequestError(err)
	}

	return &identity_platform_sdk_go.ListAppsResponse{
		Apps:       convertutil.ConvertSlice(apps.Items, converters.FromApp),
		Pagination: pagination.ConvertToPagedResponse(paginationFilter, apps),
	}, nil
}

func (s *appService) GetAppsCount(
	ctx context.Context,
	req *identity_platform_sdk_go.GetAppsCountRequest,
) (*identity_platform_sdk_go.GetAppsCountResponse, error) {
	// This method is not implemented yet.
	return nil, errutil.Err(nil, "GetAppsCount method is not implemented")
}

func (s *appService) GetApp(
	ctx context.Context,
	req *identity_platform_sdk_go.GetAppRequest,
) (*identity_platform_sdk_go.App, error) {
	if req.GetAppId() == "" {
		return nil, errutil.Err(nil, "app ID cannot be empty")
	}

	app, err := s.appSrv.GetApp(ctx, req.GetAppId())
	if err != nil {
		return nil, err
	}

	return converters.FromApp(app), nil
}

func (s *appService) UpdateApp(
	ctx context.Context,
	req *identity_platform_sdk_go.UpdateAppRequest,
) (*identity_platform_sdk_go.App, error) {
	// This method is not implemented yet.
	return nil, errutil.Err(nil, "UpdateApp method is not implemented")
}

func (s *appService) DeleteApp(
	ctx context.Context,
	req *identity_platform_sdk_go.DeleteAppRequest,
) (*emptypb.Empty, error) {
	// This method is not implemented yet.
	return nil, errutil.Err(nil, "DeleteApp method is not implemented")
}
