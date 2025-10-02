// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"slices"
	"time"

	policycore "github.com/agntcy/identity-service/internal/core/policy"
	"github.com/agntcy/identity-service/internal/core/policy/types"
	identitycontext "github.com/agntcy/identity-service/internal/pkg/context"
	"github.com/agntcy/identity-service/internal/pkg/convertutil"
	"github.com/agntcy/identity-service/internal/pkg/gormutil"
	"github.com/agntcy/identity-service/internal/pkg/pagination"
	"github.com/agntcy/identity-service/internal/pkg/pgutil"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type policyRepository struct {
	dbContext *gorm.DB
}

func NewPolicyRepository(dbContext *gorm.DB) policycore.PolicyRepository {
	return &policyRepository{
		dbContext: dbContext,
	}
}

func (r *policyRepository) Create(ctx context.Context, policy *types.Policy) error {
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

func (r *policyRepository) Update(ctx context.Context, policy *types.Policy) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return identitycontext.ErrTenantNotFound
	}

	model := newPolicyModel(policy, tenantID)

	return r.dbContext.Save(model).Error
}

func (r *policyRepository) Delete(ctx context.Context, policies ...*types.Policy) error {
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

func (r *policyRepository) DeleteByAppID(ctx context.Context, appID string) error {
	policies, err := r.GetByAppID(ctx, appID)
	if err != nil {
		return err
	}

	return r.Delete(ctx, policies...)
}

func (r *policyRepository) GetByID(ctx context.Context, id string) (*types.Policy, error) {
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

func (r *policyRepository) GetByAppID(
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

func (r *policyRepository) GetAll(
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

func (r *policyRepository) GetAllRules(
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

func (r *policyRepository) CountAll(ctx context.Context) (int64, error) {
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
