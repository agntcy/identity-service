// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	authpg "github.com/agntcy/identity-service/internal/core/auth/postgres"
	devicecore "github.com/agntcy/identity-service/internal/core/device"
	"github.com/agntcy/identity-service/internal/core/device/types"
	identitycontext "github.com/agntcy/identity-service/internal/pkg/context"
	"github.com/agntcy/identity-service/internal/pkg/convertutil"
	"github.com/agntcy/identity-service/internal/pkg/gormutil"
	"github.com/agntcy/identity-service/internal/pkg/pagination"
	"github.com/agntcy/identity-service/internal/pkg/ptrutil"
	"gorm.io/gorm"
)

type repository struct {
	dbContext *gorm.DB
}

// NewRepository creates a new instance of the Repository
func NewRepository(dbContext *gorm.DB) devicecore.Repository {
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
		return nil, errors.New("device is required")
	}

	// Get the tenant ID from the context
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return nil, identitycontext.ErrTenantNotFound
	}

	model.TenantID = tenantID

	inserted := r.dbContext.Create(model)
	if inserted.Error != nil {
		return nil, fmt.Errorf("there was an error adding the device: %w", inserted.Error)
	}

	return model.ToCoreType(), nil
}

func (r *repository) GetDevice(
	ctx context.Context,
	deviceID string,
) (*types.Device, error) {
	if deviceID == "" {
		return nil, errors.New("device ID is required")
	}

	var device Device

	result := r.dbContext.
		Where("id = ?", deviceID).
		First(&device)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, devicecore.ErrDeviceNotFound
		}

		return nil, fmt.Errorf("there was an error fetching the device: %w", result.Error)
	}

	return device.ToCoreType(), nil
}

func (r *repository) GetDevices(
	ctx context.Context,
	userID *string,
) ([]*types.Device, error) {
	var devices []*Device

	var result *gorm.DB

	// If userID is nil, we fetch all devices for the tenant
	if userID == nil {
		result = r.dbContext.
			Scopes(gormutil.BelongsToTenant(ctx)).
			Where("subscription_token IS NOT NULL AND subscription_token <> ''").
			Order("created_at ASC").
			Find(&devices)
	} else {
		result = r.dbContext.
			Scopes(gormutil.BelongsToTenant(ctx)).
			Where(
				"user_id = ? AND subscription_token IS NOT NULL AND subscription_token <> ''",
				userID,
			).
			Order("created_at ASC").
			Find(&devices)
	}

	if result.Error != nil {
		return nil, fmt.Errorf("there was an error fetching the devices: %w", result.Error)
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
		return nil, errors.New("device is required")
	}

	var existingDevice Device

	result := r.dbContext.
		Where("id = ?", device.ID).
		First(&existingDevice)
	if result.Error != nil {
		return nil, devicecore.ErrDeviceNotFound
	}

	// Update the current device
	existingDevice.SubscriptionToken = device.SubscriptionToken
	existingDevice.UserID = ptrutil.Ptr(device.UserID)
	existingDevice.Name = device.Name

	result = r.dbContext.Save(existingDevice)
	if result.Error != nil {
		return nil, fmt.Errorf("there was an error updating the device: %w", result.Error)
	}

	return existingDevice.ToCoreType(), nil
}

func (r *repository) ListRegisteredDevices(
	ctx context.Context,
	paginationFilter pagination.PaginationFilter,
	query *string,
) (*pagination.Pageable[types.Device], error) {
	dbQuery := r.dbContext.
		Scopes(gormutil.BelongsToTenant(ctx)).
		Where("subscription_token IS NOT NULL AND subscription_token <> ''")

	if query != nil && *query != "" {
		dbQuery = dbQuery.Where(
			"id ILIKE @query OR name ILIKE @query OR user_id ILIKE @query",
			sql.Named("query", "%"+*query+"%"),
		)
	}

	dbQuery = dbQuery.Session(
		&gorm.Session{},
	) // https://gorm.io/docs/method_chaining.html#Reusability-and-Safety

	var devices []*Device

	err := dbQuery.Scopes(gormutil.Paginate(paginationFilter)).
		Order("created_at DESC").
		Find(&devices).
		Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, devicecore.ErrDeviceNotFound
		}

		return nil, fmt.Errorf("there was an error fetching the devices: %w", err)
	}

	var totalDevices int64

	err = dbQuery.Model(&Device{}).Count(&totalDevices).Error
	if err != nil {
		return nil, fmt.Errorf("there was an error counting the devices: %w", err)
	}

	return &pagination.Pageable[types.Device]{
		Items: convertutil.ConvertSlice(devices, func(device *Device) *types.Device {
			return device.ToCoreType()
		}),
		Total: totalDevices,
		Page:  paginationFilter.GetPage(),
		Size:  int32(len(devices)),
	}, nil
}

func (r *repository) DeleteDevice(ctx context.Context, device *types.Device) error {
	model := newDeviceModel(device)

	err := r.dbContext.Transaction(func(tx *gorm.DB) error {
		err := tx.Where("device_id = ?", device.ID).
			Delete(&authpg.SessionDeviceOTP{}).Error
		if err != nil {
			return err
		}

		err = tx.Scopes(gormutil.BelongsToTenant(ctx)).
			Delete(model).Error
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		return fmt.Errorf("failed to delete device: %w", err)
	}

	return nil
}
