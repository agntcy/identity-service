// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Settingsentifier: Apache-2.0

package postgres

import (
	"context"
	"errors"

	badgecore "github.com/outshift/identity-service/internal/core/badge"
	"github.com/outshift/identity-service/internal/core/badge/types"
	identitycontext "github.com/outshift/identity-service/internal/pkg/context"
	"github.com/outshift/identity-service/internal/pkg/convertutil"
	"github.com/outshift/identity-service/internal/pkg/errutil"
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
		return errutil.Err(
			result.Error, "there was an error creating the badge",
		)
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
		return errutil.Err(
			result.Error, "there was an error updating the badge",
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

	result := r.dbContext.
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

func (r *postgresRepository) GetAllActiveBadges(
	ctx context.Context,
	appID string,
) ([]*types.Badge, error) {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return nil, identitycontext.ErrTenantNotFound
	}

	var badges []*Badge

	err := r.dbContext.
		Table("badges").
		Joins("LEFT JOIN credential_statuses ON badges.id = credential_statuses.verifiable_credential_id").
		Where(
			"badges.app_id = ? AND badges.tenant_id = ? AND (credential_statuses.purpose NOT IN (?) OR credential_statuses IS NULL)", //nolint:lll // long sql line
			appID,
			tenantID,
			types.CREDENTIAL_STATUS_PURPOSE_REVOCATION,
		).
		Find(&badges).Error
	if err != nil {
		return nil, errutil.Err(err, "there was an error fetching the active badges")
	}

	return convertutil.ConvertSlice(badges, func(badge *Badge) *types.Badge {
		return badge.ToCoreType()
	}), nil
}
