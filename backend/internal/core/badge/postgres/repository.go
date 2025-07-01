// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Settingsentifier: Apache-2.0

package postgres

import (
	"context"
	"errors"

	badgecore "github.com/agntcy/identity-platform/internal/core/badge"
	"github.com/agntcy/identity-platform/internal/core/badge/types"
	identitycontext "github.com/agntcy/identity-platform/internal/pkg/context"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/pkg/db"
	"gorm.io/gorm"
)

type postgresRepository struct {
	dbContext db.Context
}

func NewRepository(dbContext db.Context) badgecore.Repository {
	return &postgresRepository{
		dbContext: dbContext,
	}
}

func (r *postgresRepository) Create(ctx context.Context, badge *types.Badge) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return identitycontext.ErrTenantNotFound
	}

	model := newBadgeModel(badge, tenantID)

	result := r.dbContext.Client().Create(model)
	if result.Error != nil {
		return errutil.Err(
			result.Error, "there was an error creating the badge",
		)
	}

	return nil
}

func (r *postgresRepository) GetLatestByAppID(
	ctx context.Context,
	appID string,
) (*types.Badge, error) {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return nil, identitycontext.ErrTenantNotFound
	}

	var badge Badge

	result := r.dbContext.Client().
		Where("app_id = ? AND tenant_id = ?", appID, tenantID).
		Order("created_at desc").
		First(&badge)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errutil.Err(result.Error, "badge not found")
		}

		return nil, errutil.Err(result.Error, "there was an error fetching the badge")
	}

	return badge.ToCoreType(), nil
}
