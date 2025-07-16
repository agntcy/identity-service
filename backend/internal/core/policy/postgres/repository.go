// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"slices"
	"time"

	apptypes "github.com/agntcy/identity-platform/internal/core/app/types"
	policycore "github.com/agntcy/identity-platform/internal/core/policy"
	"github.com/agntcy/identity-platform/internal/core/policy/types"
	identitycontext "github.com/agntcy/identity-platform/internal/pkg/context"
	"github.com/agntcy/identity-platform/internal/pkg/convertutil"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/internal/pkg/gormutil"
	"github.com/agntcy/identity-platform/internal/pkg/pagination"
	"github.com/agntcy/identity-platform/internal/pkg/pgutil"
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

func (r *repository) UpdatePolicy(ctx context.Context, policy *types.Policy) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return identitycontext.ErrTenantNotFound
	}

	model := newPolicyModel(policy, tenantID)

	return r.dbContext.Client().Save(model).Error
}

func (r *repository) UpdateRule(ctx context.Context, rule *types.Rule) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return identitycontext.ErrTenantNotFound
	}

	model := NewRuleModel(rule, tenantID)

	return r.dbContext.Client().Save(model).Error
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

func (r *repository) DeletePolicies(ctx context.Context, policies ...*types.Policy) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return identitycontext.ErrTenantNotFound
	}

	err := r.dbContext.Client().Transaction(func(tx *gorm.DB) error {
		for _, policy := range policies {
			model := newPolicyModel(policy, tenantID)

			err := r.dbContext.Client().
				Exec("DELETE FROM rule_tasks WHERE rule_id IN (SELECT id from rules where policy_id = ?)", model.ID).Error
			if err != nil {
				return err
			}

			err = r.dbContext.Client().Select(clause.Associations).Delete(model).Error
			if err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return errutil.Err(
			err, "there was an error deleting the policies",
		)
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

	err := r.dbContext.Client().Transaction(func(tx *gorm.DB) error {
		for _, rule := range rules {
			model := NewRuleModel(rule, tenantID)

			err := r.dbContext.Client().Select(clause.Associations).Delete(model).Error
			if err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return errutil.Err(
			err, "there was an error deleting the rules",
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

func (r *repository) DeleteTasksByAppID(ctx context.Context, appID string) error {
	tasks, err := r.GetTasksByAppID(ctx, appID)
	if err != nil {
		return err
	}

	return r.DeleteTasks(ctx, tasks...)
}

func (r *repository) GetPolicyByID(ctx context.Context, id string) (*types.Policy, error) {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return nil, identitycontext.ErrTenantNotFound
	}

	var policy Policy

	err := r.dbContext.Client().
		Preload("Rules").
		Preload("Rules.Tasks").
		Where("policies.id = ? AND policies.tenant_id = ?", id, tenantID).
		First(&policy).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errutil.Err(err, "policy not found")
		}

		return nil, fmt.Errorf("unable to fetch policy: %w", err)
	}

	return policy.ToCoreType(), nil
}

func (r *repository) GetPoliciesByAppID(ctx context.Context, appID string) ([]*types.Policy, error) {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return nil, identitycontext.ErrTenantNotFound
	}

	policies := make([]*Policy, 0)

	err := r.dbContext.Client().
		Preload("Rules").
		Preload("Rules.Tasks").
		Where("policies.assigned_to = ? AND policies.tenant_id = ?", appID, tenantID).
		Find(&policies).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errutil.Err(err, "no policy was found")
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
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return nil, identitycontext.ErrTenantNotFound
	}

	var rule Rule

	err := r.dbContext.Client().
		Preload("Tasks").
		Where(
			"rules.id = ? AND rules.policy_id = ? AND rules.tenant_id = ?",
			ruleID,
			policyID,
			tenantID,
		).
		First(&rule).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errutil.Err(err, "rule not found")
		}

		return nil, fmt.Errorf("unable to fetch rule: %w", err)
	}

	return rule.ToCoreType(), nil
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

func (r *repository) GetTasksPerAppType(
	ctx context.Context,
	excludeAppIDs ...string,
) (map[apptypes.AppType][]*types.Task, error) {
	var tasks []*Task

	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return nil, identitycontext.ErrTenantNotFound
	}

	dbQuery := r.dbContext.Client().Where("tasks.tenant_id = ?", tenantID)

	if len(excludeAppIDs) > 0 {
		dbQuery = dbQuery.Where("tasks.app_id NOT IN (?)", excludeAppIDs)
	}

	result := dbQuery.Joins("App").Find(&tasks)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errutil.Err(result.Error, "tasks not found")
		}

		return nil, errutil.Err(result.Error, "there was an error fetching the tasks")
	}

	tasksPerAppType := make(map[apptypes.AppType][]*types.Task)
	for _, task := range tasks {
		tasksPerAppType[task.App.Type] = append(tasksPerAppType[task.App.Type], task.ToCoreType())
	}

	return tasksPerAppType, nil
}

func (r *repository) GetTasksByID(ctx context.Context, ids []string) ([]*types.Task, error) {
	var tasks []*Task

	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return nil, identitycontext.ErrTenantNotFound
	}

	result := r.dbContext.Client().Where("tenant_id = ?", tenantID).Find(&tasks, ids)
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

	dbQuery := r.dbContext.Client().
		Joins("LEFT JOIN rules ON rules.policy_id = policies.id").
		Joins("LEFT JOIN rule_tasks ON rule_tasks.rule_id = rules.id").
		Joins("LEFT JOIN tasks ON tasks.id = rule_tasks.task_id").
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
		dbQuery = dbQuery.Where("tasks.app_id IN (?)", rulesForAppIDs)
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

	err := dbQuery.Scopes(gormutil.Paginate(paginationFilter)).
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
		Find(&rows).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errutil.Err(err, "no policies found")
		}

		return nil, errutil.Err(err, "there was an error fetching the policies")
	}

	var totalPolicies int64

	err = dbQuery.Model(&Policy{}).Distinct("policies.id").Count(&totalPolicies).Error
	if err != nil {
		return nil, errutil.Err(err, "there was an error fetching the policies")
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
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return nil, identitycontext.ErrTenantNotFound
	}

	dbQuery := r.dbContext.Client().Where("tenant_id = ? AND policy_id = ?", tenantID, policyID)

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
			return nil, errutil.Err(err, "no rules found")
		}

		return nil, errutil.Err(err, "there was an error fetching the rules")
	}

	var totalRules int64

	err = dbQuery.Model(&Rule{}).Count(&totalRules).Error
	if err != nil {
		return nil, errutil.Err(err, "there was an error fetching the rules")
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
