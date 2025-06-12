// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"github.com/agntcy/identity-platform/internal/core/app/types"
)

type App struct {
	ID          string `gorm:"primaryKey"`
	Name        string `gorm:"not null;type:varchar(256);"`
	Description string `gorm:"not null;type:varchar(256);"`
	Type        string `gorm:"not null;type:varchar(64);"`
}

func (i *App) ToCoreType() *types.App {
	return &types.App{}
}

func newAppModel(src *types.App) *App {
	return &App{
		CommonName:      src.CommonName,
		Organization:    src.Organization,
		SubOrganization: src.SubOrganization,
		PublicKey:       src.PublicKey,
	}
}
