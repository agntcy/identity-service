// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Deviceentifier: Apache-2.0

package grpc

import (
	"context"

	identity_service_sdk_go "github.com/agntcy/identity-service/api/server/agntcy/identity/service/v1alpha1"
	"github.com/agntcy/identity-service/internal/bff"
	"github.com/agntcy/identity-service/internal/bff/grpc/converters"
	"github.com/agntcy/identity-service/internal/pkg/convertutil"
	"github.com/agntcy/identity-service/internal/pkg/grpcutil"
	"github.com/agntcy/identity-service/internal/pkg/pagination"
	"google.golang.org/protobuf/types/known/emptypb"
)

type deviceService struct {
	deviceSrv bff.DeviceService
}

func NewDeviceService(
	deviceSrv bff.DeviceService,
) identity_service_sdk_go.DeviceServiceServer {
	return &deviceService{
		deviceSrv: deviceSrv,
	}
}
func (s *deviceService) AddDevice(
	ctx context.Context,
	req *identity_service_sdk_go.AddDeviceRequest,
) (*identity_service_sdk_go.Device, error) {
	device, err := s.deviceSrv.AddDevice(ctx, converters.ToDevice(req.GetDevice()))
	if err != nil {
		return nil, grpcutil.Error(err)
	}

	return converters.FromDevice(device), nil
}

func (s *deviceService) RegisterDevice(
	ctx context.Context,
	req *identity_service_sdk_go.RegisterDeviceRequest,
) (*emptypb.Empty, error) {
	err := s.deviceSrv.RegisterDevice(ctx, req.GetDeviceId(), converters.ToDevice(req.GetDevice()))
	if err != nil {
		return nil, grpcutil.Error(err)
	}

	return &emptypb.Empty{}, nil
}

func (s *deviceService) ListDevices(
	ctx context.Context,
	req *identity_service_sdk_go.ListDevicesRequest,
) (*identity_service_sdk_go.ListDevicesResponse, error) {
	paginationFilter := pagination.PaginationFilter{
		Page:        req.Page,
		Size:        req.Size,
		DefaultSize: defaultPageSize,
	}

	apps, err := s.deviceSrv.ListRegisteredDevices(ctx, paginationFilter, req.Query)
	if err != nil {
		return nil, grpcutil.Error(err)
	}

	return &identity_service_sdk_go.ListDevicesResponse{
		Devices:    convertutil.ConvertSlice(apps.Items, converters.FromDevice),
		Pagination: pagination.ConvertToPagedResponse(paginationFilter, apps),
	}, nil
}

func (s *deviceService) DeleteDevice(
	ctx context.Context,
	req *identity_service_sdk_go.DeleteDeviceRequest,
) (*emptypb.Empty, error) {
	err := s.deviceSrv.DeleteDevice(ctx, req.GetDeviceId())
	if err != nil {
		return nil, grpcutil.Error(err)
	}

	return &emptypb.Empty{}, nil
}

func (s *deviceService) TestDevice(
	ctx context.Context,
	req *identity_service_sdk_go.TestDeviceRequest,
) (*emptypb.Empty, error) {
	err := s.deviceSrv.TestDevice(ctx, req.GetDeviceId())
	if err != nil {
		return nil, grpcutil.Error(err)
	}

	return &emptypb.Empty{}, nil
}
