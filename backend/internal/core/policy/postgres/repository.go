// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"slices"
	"time"

	apptypes "github.com/outshift/identity-service/internal/core/app/types"
	policycore "github.com/outshift/identity-service/internal/core/policy"
	"github.com/outshift/identity-service/internal/core/policy/types"
	identitycontext "github.com/outshift/identity-service/internal/pkg/context"
	"github.com/outshift/identity-service/internal/pkg/convertutil"
	"github.com/outshift/identity-service/internal/pkg/gormutil"
	"github.com/outshift/identity-service/internal/pkg/pagination"
	"github.com/outshift/identity-service/internal/pkg/pgutil"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type repository struct {
	dbContext *gorm.DB
}

func NewRepository(dbContext *gorm.DB) policycore.Repository {
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

	result := r.dbContext.Create(model)
	if result.Error != nil {
		return fmt.Errorf("there was an error creating the policy: %w", result.Error)
	}

	return nil
}

func (r *repository) CreateRule(ctx context.Context, rule *types.Rule) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return identitycontext.ErrTenantNotFound
	}

	model := NewRuleModel(rule, tenantID)

	result := r.dbContext.Create(model)
	if result.Error != nil {
		return fmt.Errorf("there was an error creating the rule: %w", result.Error)
	}

	return nil
}

func (r *repository) CreateTasks(ctx context.Context, tasks ...*types.Task) error {
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

func (r *repository) UpdatePolicy(ctx context.Context, policy *types.Policy) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return identitycontext.ErrTenantNotFound
	}

	model := newPolicyModel(policy, tenantID)

	return r.dbContext.Save(model).Error
}

func (r *repository) UpdateRule(ctx context.Context, rule *types.Rule) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return identitycontext.ErrTenantNotFound
	}

	return r.dbContext.Transaction(func(tx *gorm.DB) error {
		// We need to pass a new instance of the model for each call
		// since .Model() modifies the passed model and removes all the tasks.
		err := tx.Model(NewRuleModel(rule, tenantID)).Association("Tasks").Clear()
		if err != nil {
			return err
		}

		return tx.Save(NewRuleModel(rule, tenantID)).Error
	})
}

func (r *repository) UpdateTasks(ctx context.Context, tasks ...*types.Task) error {
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

func (r *repository) DeletePolicies(ctx context.Context, policies ...*types.Policy) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return identitycontext.ErrTenantNotFound
	}

	err := r.dbContext.Transaction(func(tx *gorm.DB) error {
		for _, policy := range policies {
			model := newPolicyModel(policy, tenantID)

			err := r.dbContext.
				Exec("DELETE FROM rule_tasks WHERE rule_id IN (SELECT id from rules where policy_id = ?)", model.ID).
				Error
			if err != nil {
				return err
			}

			err = r.dbContext.Select(clause.Associations).Delete(model).Error
			if err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return fmt.Errorf("there was an error deleting the policies: %w", err)
	}

	return nil
}

func (r *repository) DeletePoliciesByAppID(ctx context.Context, appID string) error {
	policies, err := r.GetPoliciesByAppID(ctx, appID)
	if err != nil {
		return err
	}

	return r.DeletePolicies(ctx, policies...)
}

func (r *repository) DeleteRules(ctx context.Context, rules ...*types.Rule) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return identitycontext.ErrTenantNotFound
	}

	err := r.dbContext.Transaction(func(tx *gorm.DB) error {
		for _, rule := range rules {
			model := NewRuleModel(rule, tenantID)

			err := r.dbContext.Select(clause.Associations).Delete(model).Error
			if err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return fmt.Errorf("there was an error deleting the rules: %w", err)
	}

	return nil
}

func (r *repository) DeleteTasks(ctx context.Context, tasks ...*types.Task) error {
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

func (r *repository) DeleteTasksByAppID(ctx context.Context, appID string) error {
	tasks, err := r.GetTasksByAppID(ctx, appID)
	if err != nil {
		return err
	}

	return r.DeleteTasks(ctx, tasks...)
}

func (r *repository) GetPolicyByID(ctx context.Context, id string) (*types.Policy, error) {
	var policy Policy

	err := r.dbContext.
		Preload("Rules").
		Preload("Rules.Tasks").
		Scopes(gormutil.BelongsToTenantForTable(ctx, "policies")).
		Where("policies.id = ?", id).
		First(&policy).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, policycore.ErrPolicyNotFound
		}

		return nil, fmt.Errorf("unable to fetch policy: %w", err)
	}

	return policy.ToCoreType(), nil
}

func (r *repository) GetPoliciesByAppID(
	ctx context.Context,
	appID string,
) ([]*types.Policy, error) {
	policies := make([]*Policy, 0)

	err := r.dbContext.
		Preload("Rules").
		Preload("Rules.Tasks").
		Scopes(gormutil.BelongsToTenantForTable(ctx, "policies")).
		Where("policies.assigned_to = ?", appID).
		Find(&policies).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, policycore.ErrPolicyNotFound
		}

		return nil, fmt.Errorf("unable to fetch policies: %w", err)
	}

	return convertutil.ConvertSlice(policies, func(policy *Policy) *types.Policy {
		return policy.ToCoreType()
	}), nil
}

func (r *repository) GetRuleByID(
	ctx context.Context,
	ruleID, policyID string,
) (*types.Rule, error) {
	var rule Rule

	err := r.dbContext.
		Preload("Tasks").
		Scopes(gormutil.BelongsToTenantForTable(ctx, "rules")).
		Where(
			"rules.id = ? AND rules.policy_id = ?",
			ruleID,
			policyID,
		).
		First(&rule).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, policycore.ErrRuleNotFound
		}

		return nil, fmt.Errorf("unable to fetch rule: %w", err)
	}

	return rule.ToCoreType(), nil
}

func (r *repository) GetTasksByAppID(ctx context.Context, appID string) ([]*types.Task, error) {
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

func (r *repository) GetTasksPerAppType(
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

func (r *repository) GetTasksByID(ctx context.Context, ids []string) ([]*types.Task, error) {
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

func (r *repository) GetAllPolicies(
	ctx context.Context,
	paginationFilter pagination.PaginationFilter,
	query *string,
	appIDs []string,
	rulesForAppIDs []string,
) (*pagination.Pageable[types.Policy], error) {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return nil, identitycontext.ErrTenantNotFound
	}

	dbQuery := r.dbContext.
		Where("policies.tenant_id = ?", tenantID)

	if query != nil && *query != "" {
		dbQuery = dbQuery.Where(
			"policies.id ILIKE @query OR policies.name ILIKE @query OR policies.description ILIKE @query",
			sql.Named("query", "%"+*query+"%"),
		)
	}

	if len(appIDs) > 0 {
		dbQuery = dbQuery.Where("policies.assigned_to IN (?)", appIDs)
	}

	if len(rulesForAppIDs) > 0 {
		dbQuery = dbQuery.Where(
			"0 < (?)",
			r.dbContext.Table("tasks").
				Select("COUNT(tasks.id)").
				Joins("LEFT JOIN rules ON rules.policy_id = policies.id").
				Joins("LEFT JOIN rule_tasks ON rule_tasks.task_id = tasks.id").
				Where("rule_tasks.rule_id = rules.id AND tasks.app_id IN (?)", rulesForAppIDs),
		)
	}

	dbQuery = dbQuery.Session(&gorm.Session{})

	var rows []*struct {
		ID                string
		Name              string
		Description       string
		AssignedTo        string
		CreatedAt         time.Time
		UpdatedAt         sql.NullTime
		RuleID            string           `gorm:"column:r__id"`
		RuleName          string           `gorm:"column:r__name"`
		RuleDescription   string           `gorm:"column:r__description"`
		RulePolicyID      string           `gorm:"column:r__policy_id"`
		RuleAction        types.RuleAction `gorm:"column:r__action"`
		RuleNeedsApproval bool             `gorm:"column:r__needs_approval"`
		RuleCreatedAt     time.Time        `gorm:"column:r__created_at"`
		RuleUpdatedAt     sql.NullTime     `gorm:"column:r__updated_at"`
	}

	err := r.dbContext.
		Table(`(?) AS main`,
			dbQuery.
				Table("policies").
				Select(`
					policies.*,
					rules.id as r__id,
					rules.name as r__name,
					rules.description as r__description,
					rules.policy_id as r__policy_id,
					rules.action as r__action,
					rules.needs_approval as r__needs_approval,
					rules.created_at as r__created_at,
					rules.updated_at as r__updated_at
				`).
				Joins("LEFT JOIN rules ON rules.policy_id = policies.id"),
		).
		Select(`*`).
		Where("main.id IN (?)",
			dbQuery.
				Table("policies").
				Select(`id`).
				Scopes(gormutil.Paginate(paginationFilter)),
		).
		Find(&rows).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, policycore.ErrPolicyNotFound
		}

		return nil, fmt.Errorf("unable to fetch policies: %w", err)
	}

	var totalPolicies int64

	err = dbQuery.Model(&Policy{}).Distinct("policies.id").Count(&totalPolicies).Error
	if err != nil {
		return nil, fmt.Errorf("unable to count policies: %w", err)
	}

	policies := make([]*types.Policy, 0)

	for _, row := range rows {
		var policy *types.Policy

		if idx := slices.IndexFunc(policies, func(p *types.Policy) bool {
			return p.ID == row.ID
		}); idx > -1 {
			policy = policies[idx]
		} else {
			policy = &types.Policy{
				ID:          row.ID,
				Name:        row.Name,
				Description: row.Description,
				AssignedTo:  row.AssignedTo,
				Rules:       []*types.Rule{},
				CreatedAt:   row.CreatedAt,
				UpdatedAt:   pgutil.SqlNullTimeToTime(row.UpdatedAt),
			}

			policies = append(policies, policy)
		}

		policy.Rules = append(policy.Rules, &types.Rule{
			ID:            row.RuleID,
			Name:          row.RuleName,
			Description:   row.RuleDescription,
			PolicyID:      row.RulePolicyID,
			Action:        row.RuleAction,
			NeedsApproval: row.RuleNeedsApproval,
			Tasks:         []*types.Task{},
			CreatedAt:     row.RuleCreatedAt,
			UpdatedAt:     pgutil.SqlNullTimeToTime(row.RuleUpdatedAt),
		})
	}

	return &pagination.Pageable[types.Policy]{
		Items: policies,
		Total: totalPolicies,
		Page:  paginationFilter.GetPage(),
		Size:  int32(len(policies)),
	}, nil
}

func (r *repository) GetAllRules(
	ctx context.Context,
	policyID string,
	paginationFilter pagination.PaginationFilter,
	query *string,
) (*pagination.Pageable[types.Rule], error) {
	dbQuery := r.dbContext.
		Scopes(gormutil.BelongsToTenant(ctx)).
		Where(" policy_id = ?", policyID)

	if query != nil && *query != "" {
		dbQuery = dbQuery.Where(
			"id ILIKE @query OR name ILIKE @query OR description ILIKE @query",
			sql.Named("query", "%"+*query+"%"),
		)
	}

	dbQuery = dbQuery.Session(&gorm.Session{})

	var rules []*Rule

	err := dbQuery.Scopes(gormutil.Paginate(paginationFilter)).
		Preload("Tasks").
		Find(&rules).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, policycore.ErrRuleNotFound
		}

		return nil, fmt.Errorf("unable to fetch rules: %w", err)
	}

	var totalRules int64

	err = dbQuery.Model(&Rule{}).Count(&totalRules).Error
	if err != nil {
		return nil, fmt.Errorf("unable to count rules: %w", err)
	}

	return &pagination.Pageable[types.Rule]{
		Items: convertutil.ConvertSlice(rules, func(rule *Rule) *types.Rule {
			return rule.ToCoreType()
		}),
		Total: totalRules,
		Page:  paginationFilter.GetPage(),
		Size:  int32(len(rules)),
	}, nil
}

func (r *repository) CountAllPolicies(ctx context.Context) (int64, error) {
	var totalPolicies int64

	err := r.dbContext.
		Model(&Policy{}).
		Scopes(gormutil.BelongsToTenant(ctx)).
		Count(&totalPolicies).
		Error
	if err != nil {
		return 0, fmt.Errorf("there was an error counting the policies: %w", err)
	}

	return totalPolicies, nil
}
