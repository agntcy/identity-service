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
