// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Appentifier: Apache-2.0

package grpc

import (
	"context"
	"errors"

	identity_platform_sdk_go "github.com/agntcy/identity-platform/api/server/agntcy/identity/platform/v1alpha1"
	"github.com/agntcy/identity-platform/internal/bff"
	"github.com/agntcy/identity-platform/internal/bff/grpc/converters"
	apptypes "github.com/agntcy/identity-platform/internal/core/app/types"
	policytypes "github.com/agntcy/identity-platform/internal/core/policy/types"
	"github.com/agntcy/identity-platform/internal/pkg/convertutil"
	"github.com/agntcy/identity-platform/internal/pkg/grpcutil"
	"github.com/agntcy/identity-platform/internal/pkg/pagination"
	"google.golang.org/protobuf/types/known/emptypb"
)

const defaultPageSize int32 = 20

type appService struct {
	appSrv   bff.AppService
	badgeSrv bff.BadgeService
}

func NewAppService(
	appSrv bff.AppService,
	badgeSrv bff.BadgeService,
) identity_platform_sdk_go.AppServiceServer {
	return &appService{
		appSrv:   appSrv,
		badgeSrv: badgeSrv,
	}
}

func (s *appService) CreateApp(
	ctx context.Context,
	req *identity_platform_sdk_go.CreateAppRequest,
) (*identity_platform_sdk_go.App, error) {
	app := converters.ToApp(req.GetApp())
	if app == nil {
		return nil, grpcutil.BadRequestError(errors.New("app cannot be nil"))
	}

	createdApp, err := s.appSrv.CreateApp(ctx, app)
	if err != nil {
		return nil, grpcutil.BadRequestError(err)
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

	appTypes := make([]apptypes.AppType, 0)

	if req.Types != nil {
		for _, typ := range req.Types {
			appTypes = append(appTypes, apptypes.AppType(typ))
		}
	}

	apps, err := s.appSrv.ListApps(ctx, paginationFilter, req.Query, appTypes)
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
	return nil, grpcutil.BadRequestError(errors.New("GetAppsCount method is not implemented"))
}

func (s *appService) GetApp(
	ctx context.Context,
	req *identity_platform_sdk_go.GetAppRequest,
) (*identity_platform_sdk_go.App, error) {
	if req.GetAppId() == "" {
		return nil, grpcutil.BadRequestError(errors.New("app ID cannot be empty"))
	}

	app, err := s.appSrv.GetApp(ctx, req.GetAppId())
	if err != nil {
		return nil, grpcutil.BadRequestError(err)
	}

	return converters.FromApp(app), nil
}

func (s *appService) UpdateApp(
	ctx context.Context,
	req *identity_platform_sdk_go.UpdateAppRequest,
) (*identity_platform_sdk_go.App, error) {
	app := converters.ToApp(req.GetApp())
	if app == nil {
		return nil, grpcutil.BadRequestError(errors.New("app cannot be nil"))
	}

	app.ID = req.AppId

	updatedApp, err := s.appSrv.UpdateApp(ctx, app)
	if err != nil {
		return nil, grpcutil.BadRequestError(err)
	}

	return converters.FromApp(updatedApp), nil
}

func (s *appService) DeleteApp(
	ctx context.Context,
	req *identity_platform_sdk_go.DeleteAppRequest,
) (*emptypb.Empty, error) {
	err := s.appSrv.DeleteApp(ctx, req.AppId)
	if err != nil {
		return nil, grpcutil.BadRequestError(err)
	}

	return &emptypb.Empty{}, nil
}

func (s *appService) GetBadge(
	ctx context.Context,
	in *identity_platform_sdk_go.GetBadgeRequest,
) (*identity_platform_sdk_go.Badge, error) {
	badge, err := s.badgeSrv.GetBadge(ctx, in.AppId)
	if err != nil {
		return nil, grpcutil.NotFoundError(err)
	}

	return converters.FromBadge(badge), nil
}

func (s *appService) GetTasks(
	ctx context.Context,
	in *identity_platform_sdk_go.GetTasksRequest,
) (*identity_platform_sdk_go.GetTasksResponse, error) {
	tasks, err := s.appSrv.GetTasks(ctx, in.AppId)
	if err != nil {
		return nil, grpcutil.BadRequestError(err)
	}

	return &identity_platform_sdk_go.GetTasksResponse{
		Tasks: convertutil.ConvertSlice(
			tasks,
			func(task *policytypes.Task) *identity_platform_sdk_go.Task {
				return converters.FromTask(task)
			},
		),
	}, nil
}
