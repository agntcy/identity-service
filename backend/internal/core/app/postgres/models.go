// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"github.com/agntcy/identity-platform/internal/core/app/types"
)

type App struct {
	ID          string        `gorm:"primaryKey"`
	TenantID    string        `gorm:"not null;type:varchar(256);"`
	Name        *string       `gorm:"not null;type:varchar(256);"`
	Description *string       `gorm:"not null;type:varchar(256);"`
	Type        types.AppType `gorm:"not null;type:varchar(256);default:'APP_TYPE_UNSPECIFIED';"`
}

func (i *App) ToCoreType() *types.App {
	return &types.App{
		ID:          i.ID,
		Name:        i.Name,
		Description: i.Description,
		Type:        i.Type,
	}
}

func newAppModel(src *types.App) *App {
	return &App{
		ID:          src.ID,
		Name:        src.Name,
		Description: src.Description,
		Type:        src.Type,
	}
}
