// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"context"
	"errors"

	appcore "github.com/agntcy/identity-platform/internal/core/app"
	"github.com/agntcy/identity-platform/internal/core/app/types"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/pkg/db"
	"gorm.io/gorm"
)

type repository struct {
	dbContext db.Context
}

// NewRepository creates a new instance of the Repository
func NewRepository(dbContext db.Context) appcore.Repository {
	return &repository{
		dbContext,
	}
}

// CreateApp creates a new App
func (r *repository) CreateApp(
	ctx context.Context,
	app *types.App,
) (*types.App, error) {
	model := newAppModel(app)

	// Create the app
	inserted := r.dbContext.Client().Create(model)
	if inserted.Error != nil {
		return nil, errutil.Err(
			inserted.Error, "there was an error creating the app",
		)
	}

	return app, nil
}

func (r *repository) GetApp(
	ctx context.Context,
	id string,
) (*types.App, error) {
	var app App

	result := r.dbContext.Client().First(&app, map[string]interface{}{
		"id": id,
	})
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errutil.Err(
				result.Error, "app not found")
		}

		return nil, errutil.Err(
			result.Error, "there was an error fetching the app",
		)
	}

	return app.ToCoreType(), nil
}
