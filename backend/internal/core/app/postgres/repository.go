// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

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
	// Get the tenant ID from the context
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return nil, identitycontext.ErrTenantNotFound
	}

	model := newAppModel(app, tenantID)

	// Create the app
	inserted := r.dbContext.Client().Create(model)
	if inserted.Error != nil {
		return nil, errutil.Err(
			inserted.Error, "there was an error creating the app",
		)
	}

	return app, nil
}

func (r *repository) UpdateApp(ctx context.Context, app *types.App) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return identitycontext.ErrTenantNotFound
	}

	model := newAppModel(app, tenantID)

	err := r.dbContext.Client().
		Where("tenant_id = ?", tenantID).
		Save(model).Error
	if err != nil {
		return errutil.Err(err, "there was an error saving the app")
	}

	return nil
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

func (r *repository) CountAllApps(ctx context.Context) (int64, error) {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return 0, errutil.Err(
			nil, "failed to get tenant ID from context",
		)
	}

	var totalApps int64

	err := r.dbContext.Client().Model(&App{}).Where("tenant_id = ?", tenantID).Count(&totalApps).Error
	if err != nil {
		return 0, errutil.Err(err, "there was an error counting the apps")
	}

	return totalApps, nil
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
		Delete(newAppModel(app, tenantID)).Error
	if err != nil {
		return errutil.Err(err, fmt.Sprintf("cannot delete app %s", app.ID))
	}

	return nil
}

func (r *repository) GetAppStatuses(
	ctx context.Context,
	appIDs ...string,
) (map[string]types.AppStatus, error) {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return nil, identitycontext.ErrTenantNotFound
	}

	var rows []*struct {
		ID     string
		Status types.AppStatus
	}

	err := r.dbContext.Client().
		Raw(`
			SELECT
				a.id,
				CASE
					WHEN COUNT(*) FILTER (WHERE b.id IS NOT NULL AND cs.id IS NULL) > 0 THEN 1 -- active
					WHEN COUNT(*) FILTER (WHERE b.id IS NOT NULL AND cs.id IS NOT NULL AND cs.purpose = 1) > 0 THEN 3 -- 'revoked'
					WHEN COUNT(*) FILTER (WHERE b.id IS NULL AND cs.id IS NULL) > 0 THEN 2 -- 'pending'
				END AS status
			FROM apps AS a
			LEFT JOIN badges AS b ON b.app_id = a.id
			LEFT JOIN credential_statuses AS cs ON cs.verifiable_credential_id = b.id
			WHERE a.tenant_id = ? AND a.id IN (?)
			GROUP BY a.id
		`, tenantID, appIDs).
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	statusPerApp := make(map[string]types.AppStatus)
	for _, row := range rows {
		statusPerApp[row.ID] = row.Status
	}

	return statusPerApp, nil
}
