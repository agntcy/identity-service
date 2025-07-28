// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	apptypes "github.com/outshift/identity-service/internal/core/app/types"
	types "github.com/outshift/identity-service/internal/core/auth/types"
	devicetypes "github.com/outshift/identity-service/internal/core/device/types"
	"github.com/outshift/identity-service/internal/pkg/secrets"
	"github.com/outshift/identity-service/internal/pkg/strutil"
	"github.com/google/uuid"
)

type Session struct {
	ID                uuid.UUID `gorm:"primaryKey;default:gen_random_uuid()"`
	CreatedAt         int64     `gorm:"autoCreateTime"`
	ExpiresAt         *int64
	OwnerAppID        uuid.UUID `gorm:"foreignKey:ID"`
	OwnerApp          *apptypes.App
	AppID             *uuid.UUID `gorm:"foreignKey:ID"`
	App               *apptypes.App
	ToolName          *string
	UserID            *string
	AccessToken       *secrets.EncryptedString `gorm:"type:varchar(16384);index:at_idx,unique;"`
	AuthorizationCode *string                  `gorm:"type:varchar(256);index:ac_idx,unique;"`
}

func (i *Session) ToCoreType() *types.Session {
	return &types.Session{
		ID:                i.ID.String(),
		OwnerAppID:        i.OwnerAppID.String(),
		AppID:             strutil.SafeUuidString(i.AppID),
		ToolName:          i.ToolName,
		UserID:            i.UserID,
		AuthorizationCode: i.AuthorizationCode,
		AccessToken:       secrets.ToString(i.AccessToken),
		CreatedAt:         i.CreatedAt,
		ExpiresAt:         i.ExpiresAt,
	}
}

func newSessionModel(src *types.Session) *Session {
	return &Session{
		OwnerAppID:        uuid.MustParse(src.OwnerAppID),
		AppID:             strutil.SafeUuid(src.AppID),
		ToolName:          src.ToolName,
		UserID:            src.UserID,
		AccessToken:       secrets.FromString(src.AccessToken),
		AuthorizationCode: src.AuthorizationCode,
		ExpiresAt:         src.ExpiresAt,
		CreatedAt:         src.CreatedAt,
	}
}

type SessionDeviceOTP struct {
	ID        uuid.UUID `gorm:"primaryKey;default:gen_random_uuid()"`
	Value     string    `gorm:"uniqueIndex"`
	SessionID string    `gorm:"foreignKey:ID"`
	Session   *Session
	DeviceID  string `gorm:"foreignKey:ID"`
	Device    *devicetypes.Device
	CreatedAt int64 `gorm:"autoCreateTime"`
	ExpiresAt int64
	Approved  *bool
	Used      bool
}

func (e *SessionDeviceOTP) ToCoreType() *types.SessionDeviceOTP {
	return &types.SessionDeviceOTP{
		ID:        e.ID.String(),
		Value:     e.Value,
		SessionID: e.SessionID,
		DeviceID:  e.DeviceID,
		CreatedAt: e.CreatedAt,
		ExpiresAt: e.ExpiresAt,
		Approved:  e.Approved,
		Used:      e.Used,
	}
}

func newSessionDeviceOTPModel(src *types.SessionDeviceOTP) *SessionDeviceOTP {
	id, _ := uuid.Parse(src.ID)

	return &SessionDeviceOTP{
		ID:        id,
		Value:     src.Value,
		SessionID: src.SessionID,
		DeviceID:  src.DeviceID,
		CreatedAt: src.CreatedAt,
		ExpiresAt: src.ExpiresAt,
		Approved:  src.Approved,
		Used:      src.Used,
	}
}
