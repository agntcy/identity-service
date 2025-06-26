// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"context"
	"errors"

	policycore "github.com/agntcy/identity-platform/internal/core/policy"
	"github.com/agntcy/identity-platform/internal/core/policy/types"
	identitycontext "github.com/agntcy/identity-platform/internal/pkg/context"
	"github.com/agntcy/identity-platform/internal/pkg/convertutil"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/pkg/db"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type repository struct {
	dbContext db.Context
}

func NewRepository(dbContext db.Context) policycore.Repository {
	return &repository{
		dbContext: dbContext,
	}
}

func (r *repository) Create(ctx context.Context, policy *types.Policy) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return identitycontext.ErrTenantNotFound
	}

	model := newPolicyModel(policy, tenantID)

	result := r.dbContext.Client().Create(model)
	if result.Error != nil {
		return errutil.Err(
			result.Error, "there was an error creating the policy",
		)
	}

	return nil
}

func (r *repository) CreateRule(ctx context.Context, rule *types.Rule) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return identitycontext.ErrTenantNotFound
	}

	model := NewRuleModel(rule, tenantID)

	result := r.dbContext.Client().Create(model)
	if result.Error != nil {
		return errutil.Err(
			result.Error, "there was an error creating the rule",
		)
	}

	return nil
}

func (r *repository) CreateTasks(ctx context.Context, tasks ...*types.Task) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return identitycontext.ErrTenantNotFound
	}

	err := r.dbContext.Client().Transaction(func(tx *gorm.DB) error {
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
		return errutil.Err(
			err, "there was an error creating the tasks",
		)
	}

	return nil
}

func (r *repository) UpdateTasks(ctx context.Context, tasks ...*types.Task) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return identitycontext.ErrTenantNotFound
	}

	err := r.dbContext.Client().Transaction(func(tx *gorm.DB) error {
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
		return errutil.Err(
			err, "there was an error updating the tasks",
		)
	}

	return nil
}

func (r *repository) DeleteTasks(ctx context.Context, tasks ...*types.Task) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return identitycontext.ErrTenantNotFound
	}

	err := r.dbContext.Client().Transaction(func(tx *gorm.DB) error {
		for _, task := range tasks {
			model := newTaskModel(task, tenantID)

			err := r.dbContext.Client().Select(clause.Associations).Delete(model).Error
			if err != nil {
				return err
			}

			// err = tx.Delete(model).Error
			// if err != nil {
			// 	return err
			// }
		}

		return nil
	})
	if err != nil {
		return errutil.Err(
			err, "there was an error deleting the tasks",
		)
	}

	return nil
}

func (r *repository) GetTasksByAppID(ctx context.Context, appID string) ([]*types.Task, error) {
	var tasks []*Task

	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return nil, identitycontext.ErrTenantNotFound
	}

	result := r.dbContext.Client().
		Where("app_id = ? AND tenant_id = ?", appID, tenantID).
		Find(&tasks)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errutil.Err(result.Error, "tasks not found")
		}

		return nil, errutil.Err(result.Error, "there was an error fetching the tasks")
	}

	return convertutil.ConvertSlice(tasks, func(task *Task) *types.Task {
		return task.ToCoreType()
	}), nil
}
