// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	types "github.com/agntcy/identity-platform/internal/core/auth/types"
)

type Session struct {
	ID         string `gorm:"primarykey"`
	CreatedAt  int64  `gorm:"autoCreateTime"`
	ExpiresAt  *int64
	OwnerAppID string `gorm:"references:OwnerAppID"`
	AppID      string `gorm:"references:AppID"`
	ToolName   *string
	UserID     *string
	TokenID    *string
	Code       *string
}

func (i *Session) ToCoreType() *types.Session {
	return &types.Session{
		ID:                i.ID,
		OwnerAppID:        i.OwnerAppID,
		AppID:             i.AppID,
		ToolName:          i.ToolName,
		UserID:            i.UserID,
		TokenID:           i.TokenID,
		AuthorizationCode: i.AuthorizationCode,
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
		TokenID:           src.TokenID,
		AuthorizationCode: src.AuthorizationCode,
		ExpiresAt:         src.ExpiresAt,
	}
}
