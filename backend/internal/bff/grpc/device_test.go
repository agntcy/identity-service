// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Appentifier: Apache-2.0

package grpc_test

import (
	"errors"
	"testing"

	"github.com/google/uuid"
	identity_service_sdk_go "github.com/outshift/identity-service/api/server/outshift/identity/service/v1alpha1"
	"github.com/outshift/identity-service/internal/bff/grpc"
	grpctesting "github.com/outshift/identity-service/internal/bff/grpc/testing"
	bffmocks "github.com/outshift/identity-service/internal/bff/mocks"
	devicetypes "github.com/outshift/identity-service/internal/core/device/types"
	"github.com/outshift/identity-service/internal/pkg/pagination"
	"github.com/outshift/identity-service/internal/pkg/ptrutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"google.golang.org/grpc/codes"
)

func TestDeviceService_AddDevice_should_succeed(t *testing.T) {
	t.Parallel()

	deviceSrv := bffmocks.NewDeviceService(t)
	deviceSrv.EXPECT().AddDevice(t.Context(), mock.Anything).Return(&devicetypes.Device{}, nil)

	sut := grpc.NewDeviceService(deviceSrv)

	ret, err := sut.AddDevice(t.Context(), &identity_service_sdk_go.AddDeviceRequest{})

	assert.NoError(t, err)
	assert.NotNil(t, ret)
}

func TestDeviceService_AddDevice_should_return_badrequest_when_core_service_fails(t *testing.T) {
	t.Parallel()

	deviceSrv := bffmocks.NewDeviceService(t)
	deviceSrv.EXPECT().AddDevice(t.Context(), mock.Anything).Return(nil, errors.New("failed"))

	sut := grpc.NewDeviceService(deviceSrv)

	_, err := sut.AddDevice(t.Context(), &identity_service_sdk_go.AddDeviceRequest{})

	grpctesting.AssertGrpcError(t, err, codes.InvalidArgument, "failed to add device: failed")
}

func TestDeviceService_RegisterDevice_should_succeed(t *testing.T) {
	t.Parallel()

	deviceID := uuid.NewString()

	deviceSrv := bffmocks.NewDeviceService(t)
	deviceSrv.EXPECT().RegisterDevice(t.Context(), deviceID, mock.Anything).Return(nil)

	sut := grpc.NewDeviceService(deviceSrv)

	_, err := sut.RegisterDevice(t.Context(), &identity_service_sdk_go.RegisterDeviceRequest{DeviceId: deviceID})

	assert.NoError(t, err)
}

func TestDeviceService_RegisterDevice_should_return_notfound_when_core_service_fails(t *testing.T) {
	t.Parallel()

	deviceSrv := bffmocks.NewDeviceService(t)
	deviceSrv.EXPECT().RegisterDevice(t.Context(), mock.Anything, mock.Anything).Return(errors.New("failed"))

	sut := grpc.NewDeviceService(deviceSrv)

	_, err := sut.RegisterDevice(t.Context(), &identity_service_sdk_go.RegisterDeviceRequest{})

	grpctesting.AssertGrpcError(t, err, codes.NotFound, "failed to get device: failed")
}

func TestDeviceService_ListDevices_should_succeed(t *testing.T) {
	t.Parallel()

	paginationFilter := pagination.PaginationFilter{
		Page:        ptrutil.Ptr(int32(22)),
		Size:        ptrutil.Ptr(int32(22)),
		DefaultSize: int32(20),
	}
	query := uuid.NewString()

	deviceSrv := bffmocks.NewDeviceService(t)
	deviceSrv.EXPECT().
		ListRegisteredDevices(t.Context(), paginationFilter, &query).
		Return(&pagination.Pageable[devicetypes.Device]{}, nil)

	sut := grpc.NewDeviceService(deviceSrv)

	ret, err := sut.ListDevices(t.Context(), &identity_service_sdk_go.ListDevicesRequest{
		Page:  paginationFilter.Page,
		Size:  paginationFilter.Size,
		Query: &query,
	})

	assert.NoError(t, err)
	assert.NotNil(t, ret)
}

func TestDeviceService_ListDevices_should_badrequest_when_core_service_fails(t *testing.T) {
	t.Parallel()

	deviceSrv := bffmocks.NewDeviceService(t)
	deviceSrv.EXPECT().
		ListRegisteredDevices(t.Context(), mock.Anything, mock.Anything).
		Return(nil, errors.New("failed"))

	sut := grpc.NewDeviceService(deviceSrv)

	_, err := sut.ListDevices(t.Context(), &identity_service_sdk_go.ListDevicesRequest{})

	grpctesting.AssertGrpcError(t, err, codes.InvalidArgument, "failed")
}

func TestDeviceService_TestDevice_should_succeed(t *testing.T) {
	t.Parallel()

	deviceID := uuid.NewString()

	deviceSrv := bffmocks.NewDeviceService(t)
	deviceSrv.EXPECT().TestDevice(t.Context(), deviceID).Return(nil)

	sut := grpc.NewDeviceService(deviceSrv)

	_, err := sut.TestDevice(t.Context(), &identity_service_sdk_go.TestDeviceRequest{DeviceId: deviceID})

	assert.NoError(t, err)
}

func TestDeviceService_TestDevice_should_returb_badrequest_when_core_service_fails(t *testing.T) {
	t.Parallel()

	deviceSrv := bffmocks.NewDeviceService(t)
	deviceSrv.EXPECT().TestDevice(t.Context(), mock.Anything).Return(errors.New("failed"))

	sut := grpc.NewDeviceService(deviceSrv)

	_, err := sut.TestDevice(t.Context(), &identity_service_sdk_go.TestDeviceRequest{})

	grpctesting.AssertGrpcError(t, err, codes.InvalidArgument, "failed")
}
