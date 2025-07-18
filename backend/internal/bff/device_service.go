// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Deviceentifier: Apache-2.0

package bff

import (
	"context"
	"time"

	devicecore "github.com/agntcy/identity-platform/internal/core/device"
	devicetypes "github.com/agntcy/identity-platform/internal/core/device/types"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/internal/pkg/pagination"
	"github.com/google/uuid"
)

type DeviceService interface {
	AddDevice(ctx context.Context, device *devicetypes.Device) (*devicetypes.Device, error)
	RegisterDevice(ctx context.Context, deviceId string, device *devicetypes.Device) error
	ListRegisteredDevices(
		ctx context.Context,
		paginationFilter pagination.PaginationFilter,
		query *string,
	) (*pagination.Pageable[devicetypes.Device], error)
	DeleteDevice(ctx context.Context, deviceID string) error
}

type deviceService struct {
	deviceRepository    devicecore.Repository
	notificationService NotificationService
}

func NewDeviceService(
	deviceRepository devicecore.Repository,
	notificationService NotificationService,
) DeviceService {
	return &deviceService{
		deviceRepository:    deviceRepository,
		notificationService: notificationService,
	}
}

func (s *deviceService) AddDevice(
	ctx context.Context,
	device *devicetypes.Device,
) (*devicetypes.Device, error) {
	if device == nil {
		return nil, errutil.Err(
			nil,
			"device cannot be nil",
		)
	}

	device.ID = uuid.NewString()
	device.CreatedAt = time.Now().UTC()

	// Add the device to the repository.
	return s.deviceRepository.AddDevice(ctx, device)
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

	// Try to send a notification about the device registration.
	if err := s.notificationService.SendDeviceRegisteredNotification(ctx, existingDevice); err != nil {
		return errutil.Err(
			err,
			"failed to send notification for device registration",
		)
	}

	_, err = s.deviceRepository.UpdateDevice(ctx, existingDevice)

	return err
}

func (s *deviceService) ListRegisteredDevices(
	ctx context.Context,
	paginationFilter pagination.PaginationFilter,
	query *string,
) (*pagination.Pageable[devicetypes.Device], error) {
	page, err := s.deviceRepository.ListRegisteredDevices(ctx, paginationFilter, query)
	if err != nil {
		return nil, errutil.Err(err, "failed to fetch registered devices")
	}

	return page, nil
}

func (s *deviceService) DeleteDevice(ctx context.Context, deviceID string) error {
	device, err := s.deviceRepository.GetDevice(ctx, deviceID)
	if err != nil {
		return err
	}

	err = s.deviceRepository.DeleteDevice(ctx, device)
	if err != nil {
		return err
	}

	return nil
}
