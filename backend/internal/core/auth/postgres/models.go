// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	apptypes "github.com/agntcy/identity-platform/internal/core/app/types"
	types "github.com/agntcy/identity-platform/internal/core/auth/types"
	"github.com/agntcy/identity-platform/internal/pkg/secrets"
	"github.com/agntcy/identity-platform/internal/pkg/strutil"
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
