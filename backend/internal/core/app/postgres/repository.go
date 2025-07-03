// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"slices"

	appcore "github.com/agntcy/identity-platform/internal/core/app"
	"github.com/agntcy/identity-platform/internal/core/app/types"
	identitycontext "github.com/agntcy/identity-platform/internal/pkg/context"
	"github.com/agntcy/identity-platform/internal/pkg/convertutil"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/internal/pkg/gormutil"
	"github.com/agntcy/identity-platform/internal/pkg/pagination"
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

	// Get the tenant ID from the context
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return nil, identitycontext.ErrTenantNotFound
	}

	// Set the tenant ID in the model
	model.TenantID = tenantID

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

	// Get the tenant ID from the context
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return nil, identitycontext.ErrTenantNotFound
	}

	result := r.dbContext.Client().First(&app, map[string]any{
		"id":        id,
		"tenant_id": tenantID,
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

func (r *repository) GetAllApps(
	ctx context.Context,
	paginationFilter pagination.PaginationFilter,
	query *string,
	appTypes []types.AppType,
) (*pagination.Pageable[types.App], error) {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return nil, errutil.Err(
			nil, "failed to get tenant ID from context",
		)
	}

	dbQuery := r.dbContext.Client().Where("tenant_id = ?", tenantID)

	if query != nil && *query != "" {
		dbQuery = dbQuery.Where(
			"id ILIKE @query OR name ILIKE @query OR description ILIKE @query",
			sql.Named("query", "%"+*query+"%"),
		)
	}

	appTypes = slices.DeleteFunc(appTypes, func(typ types.AppType) bool {
		return typ == types.APP_TYPE_UNSPECIFIED
	})
	if len(appTypes) > 0 {
		dbQuery = dbQuery.Where("type IN ?", appTypes)
	}

	dbQuery = dbQuery.Session(&gorm.Session{}) // https://gorm.io/docs/method_chaining.html#Reusability-and-Safety

	var apps []*App

	err := dbQuery.Scopes(gormutil.Paginate(paginationFilter)).Find(&apps).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errutil.Err(err, "no apps found")
		}

		return nil, errutil.Err(err, "there was an error fetching the apps")
	}

	var totalApps int64

	err = dbQuery.Model(&App{}).Count(&totalApps).Error
	if err != nil {
		return nil, errutil.Err(err, "there was an error fetching the apps")
	}

	return &pagination.Pageable[types.App]{
		Items: convertutil.ConvertSlice(apps, func(app *App) *types.App {
			return app.ToCoreType()
		}),
		Total: totalApps,
		Page:  paginationFilter.GetPage(),
		Size:  int32(len(apps)),
	}, nil
}

func (r *repository) GetAppsByID(ctx context.Context, ids []string) ([]*types.App, error) {
	var apps []*App

	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return nil, identitycontext.ErrTenantNotFound
	}

	result := r.dbContext.Client().
		Where("id IN ? AND tenant_id = ?", ids, tenantID).
		Find(&apps)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errutil.Err(result.Error, "apps not found")
		}

		return nil, errutil.Err(result.Error, "there was an error fetching the apps")
	}

	return convertutil.ConvertSlice(apps, func(app *App) *types.App {
		return app.ToCoreType()
	}), nil
}

func (r *repository) DeleteApp(ctx context.Context, app *types.App) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return identitycontext.ErrTenantNotFound
	}

	// This will make a soft delete since the entity has a DeletedAt field
	// https://gorm.io/docs/delete.html#Soft-Delete
	err := r.dbContext.Client().
		Where("tenant_id = ?", tenantID).
		Delete(newAppModel(app)).Error
	if err != nil {
		return errutil.Err(err, fmt.Sprintf("cannot delete app %s", app.ID))
	}

	return nil
}
