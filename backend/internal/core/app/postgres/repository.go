// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	appcore "github.com/agntcy/identity-service/internal/core/app"
	"github.com/agntcy/identity-service/internal/core/app/types"
	identitycontext "github.com/agntcy/identity-service/internal/pkg/context"
	"github.com/agntcy/identity-service/internal/pkg/convertutil"
	"github.com/agntcy/identity-service/internal/pkg/gormutil"
	"github.com/agntcy/identity-service/internal/pkg/pagination"
	"github.com/agntcy/identity-service/internal/pkg/sorting"
	"gorm.io/gorm"
)

type repository struct {
	dbContext *gorm.DB
}

// NewRepository creates a new instance of the Repository
func NewRepository(dbContext *gorm.DB) appcore.Repository {
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
	inserted := r.dbContext.WithContext(ctx).Create(model)
	if inserted.Error != nil {
		return nil, fmt.Errorf("there was an error creating the app: %w", inserted.Error)
	}

	return app, nil
}

func (r *repository) UpdateApp(ctx context.Context, app *types.App) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return identitycontext.ErrTenantNotFound
	}

	model := newAppModel(app, tenantID)

	err := r.dbContext.WithContext(ctx).
		Scopes(gormutil.BelongsToTenant(ctx)).
		Save(model).Error
	if err != nil {
		return fmt.Errorf("there was an error saving the app: %w", err)
	}

	return nil
}

func (r *repository) GetApp(
	ctx context.Context,
	id string,
) (*types.App, error) {
	var app App

	result := r.dbContext.WithContext(ctx).
		Scopes(gormutil.BelongsToTenant(ctx)).
		First(&app, map[string]any{
			"id": id,
		})
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, appcore.ErrAppNotFound
		}

		return nil, fmt.Errorf("there was an error fetching the app by ID: %w", result.Error)
	}

	return app.ToCoreType(), nil
}

func (r *repository) GetAppByResolverMetadataID(
	ctx context.Context,
	resolverMetadataID string,
) (*types.App, error) {
	var app App

	result := r.dbContext.WithContext(ctx).
		Scopes(gormutil.BelongsToTenant(ctx)).
		First(&app, map[string]any{
			"resolver_metadata_id": resolverMetadataID,
		})
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, appcore.ErrAppNotFound
		}

		return nil, fmt.Errorf(
			"there was an error fetching the app by resolver metadata ID: %w",
			result.Error,
		)
	}

	return app.ToCoreType(), nil
}

func (r *repository) GetAllApps(
	ctx context.Context,
	paginationFilter pagination.PaginationFilter,
	query *string,
	appTypes []types.AppType,
	sortBy sorting.Sorting,
) (*pagination.Pageable[types.App], error) {
	dbQuery := r.dbContext.WithContext(ctx)

	if query != nil && *query != "" {
		dbQuery = dbQuery.Where(
			"id ILIKE @query OR name ILIKE @query OR description ILIKE @query",
			sql.Named("query", "%"+*query+"%"),
		)
	}

	if len(appTypes) > 0 {
		dbQuery = dbQuery.Where("type IN ?", appTypes)
	}

	if sortBy.SortColumn != nil && *sortBy.SortColumn != "" {
		allowedSortFields := map[string]string{
			"id":                 "id",
			"name":               "name",
			"description":        "description",
			"type":               "type",
			"resolverMetadataId": "resolver_metadata_id",
			"createdAt":          "created_at",
			"updatedAt":          "updated_at",
		}

		dbColumn, exists := allowedSortFields[*sortBy.SortColumn]
		if !exists {
			return nil, fmt.Errorf("invalid sort field: %s", *sortBy.SortColumn)
		}

		direction := "ASC"
		if sortBy.SortDesc != nil && *sortBy.SortDesc {
			direction = "DESC"
		}

		dbQuery = dbQuery.Order(fmt.Sprintf("%s %s", dbColumn, direction))
	}

	dbQuery = dbQuery.Session(
		&gorm.Session{},
	) // https://gorm.io/docs/method_chaining.html#Reusability-and-Safety

	var apps []*App

	err := dbQuery.
		Scopes(gormutil.BelongsToTenant(ctx), gormutil.Paginate(paginationFilter)).
		Find(&apps).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, appcore.ErrAppNotFound
		}

		return nil, fmt.Errorf("there was an error fetching the apps: %w", err)
	}

	var totalApps int64

	err = dbQuery.Model(&App{}).
		Scopes(gormutil.BelongsToTenant(ctx)).
		Count(&totalApps).Error
	if err != nil {
		return nil, fmt.Errorf("there was an error counting the apps: %w", err)
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
	var totalApps int64

	err := r.dbContext.WithContext(ctx).
		Model(&App{}).
		Scopes(gormutil.BelongsToTenant(ctx)).
		Count(&totalApps).
		Error
	if err != nil {
		return 0, fmt.Errorf("there was an error counting the apps: %w", err)
	}

	return totalApps, nil
}

func (r *repository) GetAppsByID(ctx context.Context, ids []string) ([]*types.App, error) {
	var apps []*App

	result := r.dbContext.WithContext(ctx).
		Scopes(gormutil.BelongsToTenant(ctx)).
		Where("id IN ?", ids).
		Find(&apps)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, appcore.ErrAppNotFound
		}

		return nil, fmt.Errorf("there was an error fetching the apps by ID: %w", result.Error)
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
	err := r.dbContext.WithContext(ctx).
		Scopes(gormutil.BelongsToTenant(ctx)).
		Delete(newAppModel(app, tenantID)).Error
	if err != nil {
		return fmt.Errorf("cannot delete app %s", app.ID)
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

	err := r.dbContext.WithContext(ctx).
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
