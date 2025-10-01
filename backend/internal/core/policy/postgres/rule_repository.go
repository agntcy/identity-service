// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	policycore "github.com/agntcy/identity-service/internal/core/policy"
	"github.com/agntcy/identity-service/internal/core/policy/types"
	identitycontext "github.com/agntcy/identity-service/internal/pkg/context"
	"github.com/agntcy/identity-service/internal/pkg/convertutil"
	"github.com/agntcy/identity-service/internal/pkg/gormutil"
	"github.com/agntcy/identity-service/internal/pkg/pagination"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type ruleRepository struct {
	dbContext *gorm.DB
}

func NewRuleRepository(dbContext *gorm.DB) policycore.RuleRepository {
	return &ruleRepository{
		dbContext: dbContext,
	}
}

func (r *ruleRepository) Create(ctx context.Context, rule *types.Rule) error {
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

func (r *ruleRepository) Update(ctx context.Context, rule *types.Rule) error {
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

func (r *ruleRepository) Delete(ctx context.Context, rules ...*types.Rule) error {
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

func (r *ruleRepository) GetByID(
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

func (r *ruleRepository) GetAll(
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
