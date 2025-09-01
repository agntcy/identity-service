// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Appentifier: Apache-2.0

package bff_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/outshift/identity-service/internal/bff"
	bffmocks "github.com/outshift/identity-service/internal/bff/mocks"
	devicemocks "github.com/outshift/identity-service/internal/core/device/mocks"
	devicetypes "github.com/outshift/identity-service/internal/core/device/types"
	identitycontext "github.com/outshift/identity-service/internal/pkg/context"
	"github.com/stretchr/testify/assert"
)

// AddDevice

func TestDeviceService_AddDevice_should_succeed(t *testing.T) {
	t.Parallel()

	userID := uuid.NewString()
	ctx := identitycontext.InsertUserID(context.Background(), userID)
	device := &devicetypes.Device{Name: "my-device"}

	deviceRepo := devicemocks.NewRepository(t)
	deviceRepo.EXPECT().AddDevice(ctx, device).Return(device, nil)

	sut := bff.NewDeviceService(deviceRepo, nil)

	returnedDevice, err := sut.AddDevice(ctx, device)

	assert.NoError(t, err)
	assert.NotEmpty(t, returnedDevice.ID)
	assert.Equal(t, userID, returnedDevice.UserID)
	assert.Less(t, returnedDevice.CreatedAt, time.Now().UTC())
}

func TestDeviceService_AddDevice_should_return_err_when_input_is_nil(t *testing.T) {
	t.Parallel()

	sut := bff.NewDeviceService(nil, nil)

	_, err := sut.AddDevice(context.Background(), nil)

	assert.Error(t, err)
	assert.ErrorContains(t, err, "device cannot be nil")
}

// RegisterDevice

func TestDeviceService_RegisterDevice_should_succeed(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	inDevice := &devicetypes.Device{
		ID:                uuid.NewString(),
		SubscriptionToken: "token",
		Name:              "name",
	}
	expectedDevice := &devicetypes.Device{}

	deviceRepo := devicemocks.NewRepository(t)
	deviceRepo.EXPECT().GetDevice(ctx, inDevice.ID).Return(expectedDevice, nil)
	deviceRepo.EXPECT().UpdateDevice(ctx, expectedDevice).Return(expectedDevice, nil)

	notifServ := bffmocks.NewNotificationService(t)
	notifServ.EXPECT().SendDeviceRegisteredNotification(ctx, expectedDevice).Return(nil)

	sut := bff.NewDeviceService(deviceRepo, notifServ)

	err := sut.RegisterDevice(ctx, inDevice.ID, inDevice)

	assert.NoError(t, err)
	assert.Equal(t, inDevice.SubscriptionToken, expectedDevice.SubscriptionToken)
	assert.Equal(t, inDevice.Name, expectedDevice.Name)
}

func TestDeviceService_RegisterDevice_should_return_err_during_input_validation(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		deviceID string
		device   *devicetypes.Device
		errMsg   string
	}{
		"empty deviceID test case": {
			deviceID: "",
			device:   &devicetypes.Device{},
			errMsg:   "device ID cannot be empty",
		},
		"nil device test case": {
			deviceID: "something",
			device:   nil,
			errMsg:   "device cannot be nil",
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			sut := bff.NewDeviceService(nil, nil)

			err := sut.RegisterDevice(context.Background(), tc.deviceID, tc.device)

			assert.Error(t, err)
			assert.ErrorContains(t, err, tc.errMsg)
		})
	}
}
