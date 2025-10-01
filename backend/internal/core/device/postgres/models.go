// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"time"

	"github.com/agntcy/identity-service/internal/core/device/types"
	"github.com/agntcy/identity-service/internal/pkg/ptrutil"
	"github.com/google/uuid"
)

type Device struct {
	ID                uuid.UUID `gorm:"primaryKey;default:gen_random_uuid()"`
	TenantID          string    `gorm:"not null;type:varchar(256);"`
	UserID            *string   `gorm:"not null;type:varchar(256);"`
	SubscriptionToken string    `gorm:"not null;type:varchar(4096);"`
	Name              string
	CreatedAt         time.Time
}

func (d *Device) ToCoreType() *types.Device {
	if d == nil {
		return nil
	}

	return &types.Device{
		ID:                d.ID.String(),
		UserID:            ptrutil.DerefStr(d.UserID),
		SubscriptionToken: d.SubscriptionToken,
		Name:              d.Name,
		CreatedAt:         d.CreatedAt,
	}
}

func newDeviceModel(src *types.Device) *Device {
	if src == nil {
		return nil
	}

	return &Device{
		ID:                uuid.MustParse(src.ID),
		UserID:            ptrutil.Ptr(src.UserID),
		SubscriptionToken: src.SubscriptionToken,
		Name:              src.Name,
		CreatedAt:         src.CreatedAt,
	}
}
