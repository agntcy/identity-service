// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package gormutil

import (
	"context"
	"fmt"

	identitycontext "github.com/agntcy/identity-service/internal/pkg/context"
	"github.com/agntcy/identity-service/internal/pkg/pagination"
	"gorm.io/gorm"
)

func BelongsToTenant(ctx context.Context) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		tenantID, ok := identitycontext.GetTenantID(ctx)
		if !ok {
			_ = db.AddError(identitycontext.ErrTenantNotFound)

			return db
		}

		return db.Where("tenant_id = ?", tenantID)
	}
}

func BelongsToTenantForTable(ctx context.Context, table string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		tenantID, ok := identitycontext.GetTenantID(ctx)
		if !ok {
			_ = db.AddError(identitycontext.ErrTenantNotFound)

			return db
		}

		return db.Where(fmt.Sprintf("%s.tenant_id = ?", table), tenantID)
	}
}

func Paginate(filter pagination.PaginationFilter) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Offset(int(filter.GetSkip())).Limit(int(filter.GetLimit()))
	}
}
