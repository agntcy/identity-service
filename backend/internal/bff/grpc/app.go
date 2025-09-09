// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Appentifier: Apache-2.0

package grpc

import (
	"context"
	"errors"

	identity_service_sdk_go "github.com/outshift/identity-service/api/server/outshift/identity/service/v1alpha1"
	"github.com/outshift/identity-service/internal/bff"
	"github.com/outshift/identity-service/internal/bff/grpc/converters"
	apptypes "github.com/outshift/identity-service/internal/core/app/types"
	"github.com/outshift/identity-service/internal/pkg/convertutil"
	"github.com/outshift/identity-service/internal/pkg/grpcutil"
	"github.com/outshift/identity-service/internal/pkg/pagination"
	"github.com/outshift/identity-service/internal/pkg/sorting"
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
) identity_service_sdk_go.AppServiceServer {
	return &appService{
		appSrv:   appSrv,
		badgeSrv: badgeSrv,
	}
}

func (s *appService) CreateApp(
	ctx context.Context,
	req *identity_service_sdk_go.CreateAppRequest,
) (*identity_service_sdk_go.App, error) {
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
	req *identity_service_sdk_go.ListAppsRequest,
) (*identity_service_sdk_go.ListAppsResponse, error) {
	paginationFilter := pagination.PaginationFilter{
		Page:        req.Page,
		Size:        req.Size,
		DefaultSize: defaultPageSize,
	}

	appTypes := make([]apptypes.AppType, 0)

	sortBy := sorting.Sorting{
		SortColumn: req.SortColumn,
		SortDesc:   req.SortDesc,
	}

	if req.Types != nil {
		for _, typ := range req.Types {
			appTypes = append(appTypes, apptypes.AppType(typ))
		}
	}

	apps, err := s.appSrv.ListApps(ctx, paginationFilter, req.Query, appTypes, sortBy)
	if err != nil {
		return nil, grpcutil.BadRequestError(err)
	}

	return &identity_service_sdk_go.ListAppsResponse{
		Apps:       convertutil.ConvertSlice(apps.Items, converters.FromApp),
		Pagination: pagination.ConvertToPagedResponse(paginationFilter, apps),
	}, nil
}

func (s *appService) GetAppsCount(
	ctx context.Context,
	req *identity_service_sdk_go.GetAppsCountRequest,
) (*identity_service_sdk_go.GetAppsCountResponse, error) {
	totalCount, err := s.appSrv.CountAllApps(ctx)
	if err != nil {
		return nil, grpcutil.BadRequestError(err)
	}

	return &identity_service_sdk_go.GetAppsCountResponse{
		Total: totalCount,
	}, nil
}

func (s *appService) GetApp(
	ctx context.Context,
	req *identity_service_sdk_go.GetAppRequest,
) (*identity_service_sdk_go.App, error) {
	if req == nil || req.GetAppId() == "" {
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
	req *identity_service_sdk_go.UpdateAppRequest,
) (*identity_service_sdk_go.App, error) {
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
	req *identity_service_sdk_go.DeleteAppRequest,
) (*emptypb.Empty, error) {
	err := s.appSrv.DeleteApp(ctx, req.AppId)
	if err != nil {
		return nil, grpcutil.BadRequestError(err)
	}

	return &emptypb.Empty{}, nil
}

func (s *appService) RefreshAppApiKey(
	ctx context.Context,
	req *identity_service_sdk_go.RefreshAppApiKeyRequest,
) (*identity_service_sdk_go.App, error) {
	if req == nil || req.GetAppId() == "" {
		return nil, grpcutil.BadRequestError(errors.New("app ID cannot be empty"))
	}

	app, err := s.appSrv.RefreshAppApiKey(ctx, req.GetAppId())
	if err != nil {
		return nil, grpcutil.BadRequestError(err)
	}

	return converters.FromApp(app), nil
}

func (s *appService) GetBadge(
	ctx context.Context,
	in *identity_service_sdk_go.GetBadgeRequest,
) (*identity_service_sdk_go.Badge, error) {
	badge, err := s.badgeSrv.GetBadge(ctx, in.AppId)
	if err != nil {
		return nil, grpcutil.NotFoundError(err)
	}

	return converters.FromBadge(badge), nil
}

func (s *appService) GetTasks(
	ctx context.Context,
	in *identity_service_sdk_go.GetTasksRequest,
) (*identity_service_sdk_go.GetTasksResponse, error) {
	tasksPerAppType, err := s.appSrv.GetTasksPerAppType(ctx, in.GetExcludeAppIds())
	if err != nil {
		return nil, grpcutil.BadRequestError(err)
	}

	result := make(map[string]*identity_service_sdk_go.GetTasksResponse_TaskList)

	for appType, tasks := range tasksPerAppType {
		result[appType.String()] = &identity_service_sdk_go.GetTasksResponse_TaskList{
			Tasks: convertutil.ConvertSlice(
				tasks,
				converters.FromTask,
			),
		}
	}

	return &identity_service_sdk_go.GetTasksResponse{
		Result: result,
	}, nil
}
