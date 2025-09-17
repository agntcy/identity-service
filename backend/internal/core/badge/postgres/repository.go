// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Settingsentifier: Apache-2.0

package postgres

import (
	"context"
	"errors"
	"fmt"

	badgecore "github.com/outshift/identity-service/internal/core/badge"
	"github.com/outshift/identity-service/internal/core/badge/types"
	identitycontext "github.com/outshift/identity-service/internal/pkg/context"
	"github.com/outshift/identity-service/internal/pkg/convertutil"
	"github.com/outshift/identity-service/internal/pkg/gormutil"
	"gorm.io/gorm"
)

type postgresRepository struct {
	dbContext *gorm.DB
}

func NewRepository(dbContext *gorm.DB) badgecore.Repository {
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

	result := r.dbContext.Create(model)
	if result.Error != nil {
		return fmt.Errorf("there was an error creating the badge: %w", result.Error)
	}

	return nil
}

func (r *postgresRepository) Update(ctx context.Context, badge *types.Badge) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return identitycontext.ErrTenantNotFound
	}

	model := newBadgeModel(badge, tenantID)

	result := r.dbContext.Save(model)
	if result.Error != nil {
		return fmt.Errorf("there was an error updating the badge: %w", result.Error)
	}

	return nil
}

func (r *postgresRepository) GetLatestByAppID(
	ctx context.Context,
	appID string,
) (*types.Badge, error) {
	var badge Badge

	result := r.dbContext.
		Scopes(gormutil.BelongsToTenant(ctx)).
		Where("app_id = ?", appID).
		Order("created_at desc").
		First(&badge)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, badgecore.ErrBadgeNotFound
		}

		return nil, fmt.Errorf("there was an error fetching the badge: %w", result.Error)
	}

	return badge.ToCoreType(), nil
}

func (r *postgresRepository) GetAllActiveBadges(
	ctx context.Context,
	appID string,
) ([]*types.Badge, error) {
	var badges []*Badge

	err := r.dbContext.
		Table("badges").
		Scopes(gormutil.BelongsToTenantForTable(ctx, "badges")).
		Joins("LEFT JOIN credential_statuses ON badges.id = credential_statuses.verifiable_credential_id").
		Where(
			"badges.app_id = ? AND (credential_statuses.purpose NOT IN (?) OR credential_statuses IS NULL)",
			appID,
			types.CREDENTIAL_STATUS_PURPOSE_REVOCATION,
		).
		Find(&badges).Error
	if err != nil {
		return nil, fmt.Errorf("there was an error fetching the active badges: %w", err)
	}

	return convertutil.ConvertSlice(badges, func(badge *Badge) *types.Badge {
		return badge.ToCoreType()
	}), nil
}
