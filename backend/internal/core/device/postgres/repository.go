// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"context"
	"errors"

	devicecore "github.com/agntcy/identity-platform/internal/core/device"
	"github.com/agntcy/identity-platform/internal/core/device/types"
	identitycontext "github.com/agntcy/identity-platform/internal/pkg/context"
	"github.com/agntcy/identity-platform/internal/pkg/convertutil"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/internal/pkg/ptrutil"
	"github.com/agntcy/identity-platform/pkg/db"
	"gorm.io/gorm"
)

type repository struct {
	dbContext db.Context
}

// NewRepository creates a new instance of the Repository
func NewRepository(dbContext db.Context) devicecore.Repository {
	return &repository{
		dbContext,
	}
}

func (r *repository) AddDevice(
	ctx context.Context,
	device *types.Device,
) (*types.Device, error) {
	model := newDeviceModel(device)
	if model == nil {
		return nil, errutil.Err(
			errors.New("device cannot be nil"), "device is required",
		)
	}

	// Get the tenant ID from the context
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return nil, identitycontext.ErrTenantNotFound
	}
	model.TenantID = tenantID

	inserted := r.dbContext.Client().Create(model)
	if inserted.Error != nil {
		return nil, errutil.Err(
			inserted.Error, "there was an error adding the device",
		)
	}

	return model.ToCoreType(), nil
}

func (r *repository) GetDevice(
	ctx context.Context,
	deviceID string,
) (*types.Device, error) {
	if deviceID == "" {
		return nil, errutil.Err(
			errors.New("device ID cannot be empty"), "device ID is required",
		)
	}

	var device Device

	result := r.dbContext.Client().
		Where("id = ?", deviceID).
		First(&device)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errutil.Err(
				result.Error, "device not found",
			)
		}
		return nil, errutil.Err(
			result.Error, "there was an error fetching the device",
		)
	}

	return device.ToCoreType(), nil
}

func (r *repository) GetDevices(
	ctx context.Context,
	userID *string,
) ([]*types.Device, error) {
	var devices []*Device

	// Get the tenant ID from the context
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return nil, identitycontext.ErrTenantNotFound
	}

	var result *gorm.DB

	// If userID is nil, we fetch all devices for the tenant
	if userID == nil {
		result = r.dbContext.Client().
			Where("tenant_id = ?", tenantID).
			Find(&devices)
	} else {
		result = r.dbContext.Client().
			Where("tenant_id = ? AND user_id = ?", tenantID, userID).
			Find(&devices)
	}

	if result.Error != nil {
		return nil, errutil.Err(
			result.Error, "there was an error fetching the devices",
		)
	}

	return convertutil.ConvertSlice(devices, func(device *Device) *types.Device {
		return device.ToCoreType()
	}), nil
}

func (r *repository) UpdateDevice(
	ctx context.Context,
	device *types.Device,
) (*types.Device, error) {
	if device == nil {
		return nil, errutil.Err(
			errors.New("device cannot be nil"), "device is required",
		)
	}

	var existingDevice Device

	result := r.dbContext.Client().
		Where("id = ?", device.ID).
		First(&existingDevice)
	if result.Error != nil {
		return nil, errutil.Err(
			result.Error, "device not found",
		)
	}

	// Update the current device
	existingDevice.SubscriptionToken = device.SubscriptionToken
	existingDevice.UserID = ptrutil.Ptr(device.UserID)

	result = r.dbContext.Client().Save(existingDevice)
	if result.Error != nil {
		return nil, errutil.Err(
			result.Error, "there was an error updating the device",
		)
	}

	return existingDevice.ToCoreType(), nil
}
