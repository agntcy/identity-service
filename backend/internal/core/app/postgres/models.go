// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"database/sql"
	"time"

	"github.com/agntcy/identity-service/internal/core/app/types"
	"github.com/agntcy/identity-service/internal/pkg/pgutil"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type App struct {
	ID                 uuid.UUID     `gorm:"primaryKey;default:gen_random_uuid()"`
	TenantID           string        `gorm:"not null;type:varchar(256);index"`
	Name               *string       `gorm:"not null;type:varchar(256);"`
	Description        *string       `gorm:"not null;type:varchar(256);"`
	Type               types.AppType `gorm:"not null;type:uint;default:0;"`
	ResolverMetadataID string        `gorm:"not null;type:varchar(256);index:did_idx,unique;"`
	CreatedAt          time.Time
	UpdatedAt          sql.NullTime
	DeletedAt          gorm.DeletedAt `gorm:"index"`
}

func (i *App) ToCoreType() *types.App {
	return &types.App{
		ID:                 i.ID.String(),
		Name:               i.Name,
		Description:        i.Description,
		Type:               i.Type,
		ResolverMetadataID: i.ResolverMetadataID,
		CreatedAt:          i.CreatedAt,
		UpdatedAt:          pgutil.SqlNullTimeToTime(i.UpdatedAt),
		DeletedAt: pgutil.SqlNullTimeToTime(sql.NullTime{
			Time:  i.DeletedAt.Time,
			Valid: i.DeletedAt.Valid,
		}),
	}
}

func newAppModel(src *types.App, tenantID string) *App {
	return &App{
		ID:                 uuid.MustParse(src.ID),
		TenantID:           tenantID,
		Name:               src.Name,
		Description:        src.Description,
		Type:               src.Type,
		ResolverMetadataID: src.ResolverMetadataID,
		CreatedAt:          src.CreatedAt,
		UpdatedAt:          pgutil.TimeToSqlNullTime(src.UpdatedAt),
		DeletedAt:          gorm.DeletedAt(pgutil.TimeToSqlNullTime(src.DeletedAt)),
	}
}
