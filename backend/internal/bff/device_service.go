// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Deviceentifier: Apache-2.0

package bff

import (
	"context"

	devicecore "github.com/agntcy/identity-platform/internal/core/device"
	devicetypes "github.com/agntcy/identity-platform/internal/core/device/types"
	issuercore "github.com/agntcy/identity-platform/internal/core/issuer"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	outshiftiam "github.com/agntcy/identity-platform/internal/pkg/iam"
)

type DeviceService interface {
	AddDevice(ctx context.Context, *devicetypes.Device) error
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
		return errutil.ErrInvalidArgument("device cannot be nil")
	}

	// Validate the device before adding it.
	if err := device.Validate(); err != nil {
		return errutil.ErrInvalidArgument("invalid device: %w", err)
	}

	// Add the device to the repository.
	if _, err := s.deviceRepository.AddDevice(ctx, device); err != nil {
		return errutil.ErrInternal("failed to add device: %w", err)
	}

	return nil
}
