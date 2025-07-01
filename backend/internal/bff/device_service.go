// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Deviceentifier: Apache-2.0

package bff

import (
	"context"

	devicecore "github.com/agntcy/identity-platform/internal/core/device"
	devicetypes "github.com/agntcy/identity-platform/internal/core/device/types"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
)

type DeviceService interface {
	AddDevice(ctx context.Context, device *devicetypes.Device) error
	RegisterDevice(ctx context.Context, deviceId string, device *devicetypes.Device) error
}

type deviceService struct {
	deviceRepository devicecore.Repository
}

func NewDeviceService(
	deviceRepository devicecore.Repository,
) DeviceService {
	return &deviceService{
		deviceRepository: deviceRepository,
	}
}

func (s *deviceService) AddDevice(
	ctx context.Context,
	device *devicetypes.Device,
) error {
	if device == nil {
		return errutil.Err(
			nil,
			"device cannot be nil",
		)
	}

	// Add the device to the repository.
	_, err := s.deviceRepository.AddDevice(ctx, device)

	return err
}

func (s *deviceService) RegisterDevice(
	ctx context.Context,
	deviceId string,
	device *devicetypes.Device,
) error {
	if device == nil {
		return errutil.Err(
			nil,
			"device cannot be nil",
		)
	}

	if deviceId == "" {
		return errutil.Err(
			nil,
			"device ID cannot be empty",
		)
	}

	// Get the device from the repository.
	existingDevice, err := s.deviceRepository.GetDevice(ctx, deviceId)
	if err != nil {
		return errutil.Err(
			err,
			"failed to get device",
		)
	}

	// Update
	existingDevice.SubscriptionToken = device.SubscriptionToken
	existingDevice.UserID = device.UserID

	// Save the updated device back to the repository.
	_, err = s.deviceRepository.UpdateDevice(ctx, existingDevice)

	return err
}
