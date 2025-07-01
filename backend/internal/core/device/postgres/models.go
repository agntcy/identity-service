// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"github.com/agntcy/identity-platform/internal/core/device/types"
	"github.com/agntcy/identity-platform/internal/pkg/ptrutil"
	"github.com/google/uuid"
)

type Device struct {
	ID                uuid.UUID `gorm:"primaryKey;default:gen_random_uuid()"`
	TenantID          string    `gorm:"not null;type:varchar(256);"`
	UserID            *string   `gorm:"not null;type:varchar(256);"`
	SubscriptionToken string    `gorm:"not null;type:varchar(4096);"`
}

func (d *Device) ToCoreType() *types.Device {
	if d == nil {
		return nil
	}

	return &types.Device{
		ID:                d.ID.String(),
		UserID:            ptrutil.DerefStr(d.UserID),
		SubscriptionToken: d.SubscriptionToken,
	}
}

func newDeviceModel(src *types.Device) *Device {
	if src == nil {
		return nil
	}

	return &Device{
		UserID:            ptrutil.Ptr(src.UserID),
		SubscriptionToken: src.SubscriptionToken,
	}
}
