// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Appentifier: Apache-2.0

package grpc_test

import (
	"errors"
	"testing"

	identity_service_sdk_go "github.com/agntcy/identity-service/api/server/agntcy/identity/service/v1alpha1"
	"github.com/agntcy/identity-service/internal/bff/grpc"
	bffmocks "github.com/agntcy/identity-service/internal/bff/mocks"
	devicetypes "github.com/agntcy/identity-service/internal/core/device/types"
	"github.com/agntcy/identity-service/internal/pkg/pagination"
	"github.com/agntcy/identity-service/internal/pkg/ptrutil"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

var errDeviceUnexpected = errors.New("failed")

func TestDeviceService_AddDevice_should_succeed(t *testing.T) {
	t.Parallel()

	deviceSrv := bffmocks.NewDeviceService(t)
	deviceSrv.EXPECT().AddDevice(t.Context(), mock.Anything).Return(&devicetypes.Device{}, nil)

	sut := grpc.NewDeviceService(deviceSrv)

	ret, err := sut.AddDevice(t.Context(), &identity_service_sdk_go.AddDeviceRequest{})

	assert.NoError(t, err)
	assert.NotNil(t, ret)
}

func TestDeviceService_AddDevice_should_propagate_error_when_core_service_fails(t *testing.T) {
	t.Parallel()

	deviceSrv := bffmocks.NewDeviceService(t)
	deviceSrv.EXPECT().AddDevice(t.Context(), mock.Anything).Return(nil, errDeviceUnexpected)

	sut := grpc.NewDeviceService(deviceSrv)

	_, err := sut.AddDevice(t.Context(), &identity_service_sdk_go.AddDeviceRequest{})

	assert.ErrorIs(t, err, errDeviceUnexpected)
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

func TestDeviceService_RegisterDevice_should_propagate_error_when_core_service_fails(t *testing.T) {
	t.Parallel()

	deviceSrv := bffmocks.NewDeviceService(t)
	deviceSrv.EXPECT().RegisterDevice(t.Context(), mock.Anything, mock.Anything).Return(errDeviceUnexpected)

	sut := grpc.NewDeviceService(deviceSrv)

	_, err := sut.RegisterDevice(t.Context(), &identity_service_sdk_go.RegisterDeviceRequest{})

	assert.ErrorIs(t, err, errDeviceUnexpected)
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

func TestDeviceService_ListDevices_should_propagate_error_when_core_service_fails(t *testing.T) {
	t.Parallel()

	deviceSrv := bffmocks.NewDeviceService(t)
	deviceSrv.EXPECT().
		ListRegisteredDevices(t.Context(), mock.Anything, mock.Anything).
		Return(nil, errDeviceUnexpected)

	sut := grpc.NewDeviceService(deviceSrv)

	_, err := sut.ListDevices(t.Context(), &identity_service_sdk_go.ListDevicesRequest{})

	assert.ErrorIs(t, err, errDeviceUnexpected)
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

func TestDeviceService_TestDevice_should_propagate_error_when_core_service_fails(t *testing.T) {
	t.Parallel()

	deviceSrv := bffmocks.NewDeviceService(t)
	deviceSrv.EXPECT().TestDevice(t.Context(), mock.Anything).Return(errDeviceUnexpected)

	sut := grpc.NewDeviceService(deviceSrv)

	_, err := sut.TestDevice(t.Context(), &identity_service_sdk_go.TestDeviceRequest{})

	assert.ErrorIs(t, err, errDeviceUnexpected)
}
