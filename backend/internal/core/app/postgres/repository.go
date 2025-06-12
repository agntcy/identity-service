// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"context"

	"github.com/agntcy/identity-platform/internal/core/app/types"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/pkg/db"
)

type idPostgresRepository struct {
	dbContext db.Context
}

func NewIdRepository(dbContext db.Context) idcore.IdRepository {
	return &idPostgresRepository{
		dbContext: dbContext,
	}
}

func (r *idPostgresRepository) CreateApp(
	ctx context.Context,
	app *types.App,
) (*types.App, error) {
	result := r.dbContext.Client().Create(app)

	if result.Error != nil {
		return nil, errutil.Err(
			result.Error, "there was an error creating the resolver metadata",
		)
	}

	return app, nil
}
