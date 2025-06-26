// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Settingsentifier: Apache-2.0

package postgres

import (
	"context"

	badgecore "github.com/agntcy/identity-platform/internal/core/badge"
	"github.com/agntcy/identity-platform/internal/core/badge/types"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/pkg/db"
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
	model := newBadgeModel(badge)

	result := r.dbContext.Client().Create(model)
	if result.Error != nil {
		return errutil.Err(
			result.Error, "there was an error creating the badge",
		)
	}

	return nil
}
