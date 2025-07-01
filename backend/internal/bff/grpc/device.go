// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Deviceentifier: Apache-2.0

package grpc

import (
	"context"

	identity_platform_sdk_go "github.com/agntcy/identity-platform/api/server/agntcy/identity/platform/v1alpha1"
	"github.com/agntcy/identity-platform/internal/bff"
	"github.com/agntcy/identity-platform/internal/bff/grpc/converters"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/internal/pkg/grpcutil"
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
) (*emptypb.Empty, error) {
	err := s.deviceSrv.AddDevice(ctx, converters.ToDevice(req.GetDevice()))

	if err != nil {
		return nil, grpcutil.BadRequestError(errutil.Err(
			err,
			"failed to add device",
		))
	}

	return &emptypb.Empty{}, err
}

func (s *deviceService) RegisterDevice(
	ctx context.Context,
	req *identity_platform_sdk_go.RegisterDeviceRequest,
) (*emptypb.Empty, error) {
	err := s.deviceSrv.RegisterDevice(ctx, req.GetDeviceId(), converters.ToDevice(req.GetDevice()))
	if err != nil {
		return nil, grpcutil.NotFoundError(errutil.Err(
			err,
			"failed to get device",
		))
	}

	return &emptypb.Empty{}, nil
}
