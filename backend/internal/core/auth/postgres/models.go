// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	types "github.com/agntcy/identity-platform/internal/core/auth/types"
	"github.com/agntcy/identity-platform/internal/pkg/secrets"
)

type Session struct {
	ID                string `gorm:"primarykey"`
	CreatedAt         int64  `gorm:"autoCreateTime"`
	ExpiresAt         *int64
	OwnerAppID        string `gorm:"references:OwnerAppID"`
	AppID             string `gorm:"references:AppID"`
	ToolName          *string
	UserID            *string
	AccessToken       *secrets.EncryptedString `gorm:"type:varchar(16384);index:at_idx,unique;"`
	AuthorizationCode *string                  `gorm:"type:varchar(256);index:ac_idx,unique;"`
}

func (i *Session) ToCoreType() *types.Session {
	return &types.Session{
		ID:                i.ID,
		OwnerAppID:        i.OwnerAppID,
		AppID:             i.AppID,
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
		ID:                src.ID,
		OwnerAppID:        src.OwnerAppID,
		AppID:             src.AppID,
		ToolName:          src.ToolName,
		UserID:            src.UserID,
		AccessToken:       secrets.FromString(src.AccessToken),
		AuthorizationCode: src.AuthorizationCode,
		ExpiresAt:         src.ExpiresAt,
		CreatedAt:         src.CreatedAt,
	}
}
