// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"github.com/agntcy/identity-platform/internal/core/app/types"
	"github.com/google/uuid"
)

type App struct {
	ID                 uuid.UUID     `gorm:"primaryKey;default:gen_random_uuid()"`
	TenantID           string        `gorm:"not null;type:varchar(256);index"`
	Name               *string       `gorm:"not null;type:varchar(256);"`
	Description        *string       `gorm:"not null;type:varchar(256);"`
	Type               types.AppType `gorm:"not null;type:uint;default:0;"`
	ResolverMetadataID string        `gorm:"not null;type:varchar(256);index:did_idx,unique;"`
}

func (i *App) ToCoreType() *types.App {
	return &types.App{
		ID:                 i.ID.String(),
		Name:               i.Name,
		Description:        i.Description,
		Type:               i.Type,
		ResolverMetadataID: i.ResolverMetadataID,
	}
}

func newAppModel(src *types.App) *App {
	return &App{
		ID:                 uuid.MustParse(src.ID),
		Name:               src.Name,
		Description:        src.Description,
		Type:               src.Type,
		ResolverMetadataID: src.ResolverMetadataID,
	}
}
