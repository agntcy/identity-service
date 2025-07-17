// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Deviceentifier: Apache-2.0

package grpc

import (
	"context"

	identity_platform_sdk_go "github.com/agntcy/identity-platform/api/server/agntcy/identity/platform/v1alpha1"
	"github.com/agntcy/identity-platform/internal/bff"
	"github.com/agntcy/identity-platform/internal/bff/grpc/converters"
	"github.com/agntcy/identity-platform/internal/pkg/convertutil"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/internal/pkg/grpcutil"
	"github.com/agntcy/identity-platform/internal/pkg/pagination"
	"github.com/agntcy/identity-platform/pkg/log"
	"google.golang.org/protobuf/types/known/emptypb"
)

type deviceService struct {
	deviceSrv bff.DeviceService
}

func NewDeviceService(
	deviceSrv bff.DeviceService,
) identity_platform_sdk_go.DeviceServiceServer {
	return &deviceService{
		deviceSrv: deviceSrv,
	}
}
func (s *deviceService) AddDevice(
	ctx context.Context,
	req *identity_platform_sdk_go.AddDeviceRequest,
) (*identity_platform_sdk_go.Device, error) {
	device, err := s.deviceSrv.AddDevice(ctx, converters.ToDevice(req.GetDevice()))
	if err != nil {
		return nil, grpcutil.BadRequestError(errutil.Err(
			err,
			"failed to add device",
		))
	}

	return converters.FromDevice(device), nil
}

func (s *deviceService) RegisterDevice(
	ctx context.Context,
	req *identity_platform_sdk_go.RegisterDeviceRequest,
) (*emptypb.Empty, error) {
	log.Debug(*req.GetDevice().SubscriptionToken)

	err := s.deviceSrv.RegisterDevice(ctx, req.GetDeviceId(), converters.ToDevice(req.GetDevice()))
	if err != nil {
		return nil, grpcutil.NotFoundError(errutil.Err(
			err,
			"failed to get device",
		))
	}

	return &emptypb.Empty{}, nil
}

func (s *deviceService) ListDevices(
	ctx context.Context,
	req *identity_platform_sdk_go.ListDevicesRequest,
) (*identity_platform_sdk_go.ListDevicesResponse, error) {
	paginationFilter := pagination.PaginationFilter{
		Page:        req.Page,
		Size:        req.Size,
		DefaultSize: defaultPageSize,
	}

	apps, err := s.deviceSrv.ListRegisteredDevices(ctx, paginationFilter, req.Query)
	if err != nil {
		return nil, grpcutil.BadRequestError(err)
	}

	return &identity_platform_sdk_go.ListDevicesResponse{
		Devices:    convertutil.ConvertSlice(apps.Items, converters.FromDevice),
		Pagination: pagination.ConvertToPagedResponse(paginationFilter, apps),
	}, nil
}

func (s *deviceService) DeleteDevice(
	ctx context.Context,
	req *identity_platform_sdk_go.DeleteDeviceRequest,
) (*emptypb.Empty, error) {
	err := s.deviceSrv.DeleteDevice(ctx, req.GetDeviceId())
	if err != nil {
		return nil, grpcutil.BadRequestError(err)
	}

	return &emptypb.Empty{}, nil
}
