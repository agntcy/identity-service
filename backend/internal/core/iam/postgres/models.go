// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"database/sql"
	"time"

	"github.com/agntcy/identity-service/internal/core/iam/types"
	"github.com/agntcy/identity-service/internal/pkg/pgutil"
	"github.com/agntcy/identity-service/internal/pkg/secrets"
	"github.com/agntcy/identity-service/internal/pkg/strutil"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type APIKey struct {
	ID        uuid.UUID `gorm:"primaryKey;default:gen_random_uuid()"`
	TenantID  string    `gorm:"not null;type:varchar(256);"`
	Name      string
	Secret    *secrets.EncryptedString `gorm:"type:varchar(16384);index:at_idx,unique;"`
	AppID     *uuid.UUID               `gorm:"foreignKey:ID"`
	CreatedAt time.Time
	UpdatedAt sql.NullTime
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

func (d *APIKey) ToCoreType(crypter secrets.Crypter) *types.APIKey {
	if d == nil {
		return nil
	}

	return &types.APIKey{
		ID:        d.ID.String(),
		Name:      d.Name,
		Secret:    secrets.EncryptedStringToRaw(d.Secret, crypter),
		TenantID:  d.TenantID,
		AppID:     strutil.SafeUuidString(d.AppID),
		CreatedAt: d.CreatedAt,
		UpdatedAt: pgutil.SqlNullTimeToTime(d.UpdatedAt),
		DeletedAt: pgutil.SqlNullTimeToTime(sql.NullTime{
			Time:  d.DeletedAt.Time,
			Valid: d.DeletedAt.Valid,
		}),
	}
}

func newAPIKeyModel(src *types.APIKey, crypter secrets.Crypter) *APIKey {
	if src == nil {
		return nil
	}

	return &APIKey{
		ID:        uuid.MustParse(src.ID),
		Name:      src.Name,
		Secret:    secrets.NewEncryptedString(src.Secret, crypter),
		TenantID:  src.TenantID,
		AppID:     strutil.SafeUuid(src.AppID),
		CreatedAt: src.CreatedAt,
		UpdatedAt: pgutil.TimeToSqlNullTime(src.UpdatedAt),
		DeletedAt: gorm.DeletedAt(pgutil.TimeToSqlNullTime(src.DeletedAt)),
	}
}
