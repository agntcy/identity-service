// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"context"
	"errors"
	"fmt"

	apptypes "github.com/agntcy/identity-service/internal/core/app/types"
	policycore "github.com/agntcy/identity-service/internal/core/policy"
	"github.com/agntcy/identity-service/internal/core/policy/types"
	identitycontext "github.com/agntcy/identity-service/internal/pkg/context"
	"github.com/agntcy/identity-service/internal/pkg/convertutil"
	"github.com/agntcy/identity-service/internal/pkg/gormutil"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type taskRepository struct {
	dbContext *gorm.DB
}

func NewTaskRepository(dbContext *gorm.DB) policycore.TaskRepository {
	return &taskRepository{
		dbContext: dbContext,
	}
}

func (r *taskRepository) Create(ctx context.Context, tasks ...*types.Task) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return identitycontext.ErrTenantNotFound
	}

	err := r.dbContext.Transaction(func(tx *gorm.DB) error {
		for _, task := range tasks {
			model := newTaskModel(task, tenantID)

			err := tx.Create(model).Error
			if err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return fmt.Errorf("there was an error creating the tasks: %w", err)
	}

	return nil
}

func (r *taskRepository) Update(ctx context.Context, tasks ...*types.Task) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return identitycontext.ErrTenantNotFound
	}

	err := r.dbContext.Transaction(func(tx *gorm.DB) error {
		for _, task := range tasks {
			model := newTaskModel(task, tenantID)

			err := tx.Save(model).Error
			if err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return fmt.Errorf("there was an error updating the tasks: %w", err)
	}

	return nil
}

func (r *taskRepository) Delete(ctx context.Context, tasks ...*types.Task) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return identitycontext.ErrTenantNotFound
	}

	err := r.dbContext.Transaction(func(tx *gorm.DB) error {
		for _, task := range tasks {
			model := newTaskModel(task, tenantID)

			err := r.dbContext.Select(clause.Associations).Delete(model).Error
			if err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return fmt.Errorf("there was an error deleting the tasks: %w", err)
	}

	return nil
}

func (r *taskRepository) DeleteByAppID(ctx context.Context, appID string) error {
	tasks, err := r.GetByAppID(ctx, appID)
	if err != nil {
		return err
	}

	return r.Delete(ctx, tasks...)
}

func (r *taskRepository) GetByAppID(ctx context.Context, appID string) ([]*types.Task, error) {
	var tasks []*Task

	result := r.dbContext.
		Scopes(gormutil.BelongsToTenant(ctx)).
		Where("app_id = ?", appID).
		Find(&tasks)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, policycore.ErrTaskNotFound
		}

		return nil, fmt.Errorf("unable to fetch tasks by app ID: %w", result.Error)
	}

	return convertutil.ConvertSlice(tasks, func(task *Task) *types.Task {
		return task.ToCoreType()
	}), nil
}

func (r *taskRepository) GetPerAppType(
	ctx context.Context,
	excludeAppIDs ...string,
) (map[apptypes.AppType][]*types.Task, error) {
	var tasks []*Task

	dbQuery := r.dbContext.Scopes(gormutil.BelongsToTenantForTable(ctx, "tasks"))

	if len(excludeAppIDs) > 0 {
		dbQuery = dbQuery.Where("tasks.app_id NOT IN (?)", excludeAppIDs)
	}

	result := dbQuery.Joins("App").Find(&tasks)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, policycore.ErrTaskNotFound
		}

		return nil, fmt.Errorf("unable to fetch tasks per app type: %w", result.Error)
	}

	tasksPerAppType := make(map[apptypes.AppType][]*types.Task)
	for _, task := range tasks {
		tasksPerAppType[task.App.Type] = append(tasksPerAppType[task.App.Type], task.ToCoreType())
	}

	return tasksPerAppType, nil
}

func (r *taskRepository) GetByID(ctx context.Context, ids []string) ([]*types.Task, error) {
	var tasks []*Task

	result := r.dbContext.
		Scopes(gormutil.BelongsToTenant(ctx)).
		Find(&tasks, ids)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, policycore.ErrTaskNotFound
		}

		return nil, fmt.Errorf("unable to fetch tasks: %w", result.Error)
	}

	return convertutil.ConvertSlice(tasks, func(task *Task) *types.Task {
		return task.ToCoreType()
	}), nil
}
