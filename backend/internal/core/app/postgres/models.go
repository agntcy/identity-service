// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"database/sql"
	"time"

	"github.com/agntcy/identity-platform/internal/core/app/types"
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
		UpdatedAt:          SqlNullTimeToTime(i.UpdatedAt),
		DeletedAt: SqlNullTimeToTime(sql.NullTime{
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
		UpdatedAt:          TimeToSqlNullTime(src.UpdatedAt),
		DeletedAt:          gorm.DeletedAt(TimeToSqlNullTime(src.DeletedAt)),
	}
}

func SqlNullTimeToTime(t sql.NullTime) *time.Time {
	if t.Valid {
		return &t.Time
	}

	return nil
}

func TimeToSqlNullTime(t *time.Time) sql.NullTime {
	if t != nil {
		return sql.NullTime{Time: *t, Valid: true}
	}

	return sql.NullTime{Valid: false}
}
