// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package policy

import (
	"context"

	"github.com/agntcy/identity-platform/internal/core/policy/types"
	"github.com/agntcy/identity-platform/internal/pkg/pagination"
)

type Repository interface {
	Create(ctx context.Context, policy *types.Policy) error
	CreateRule(ctx context.Context, rule *types.Rule) error
	CreateTasks(ctx context.Context, tasks ...*types.Task) error
	UpdateTasks(ctx context.Context, tasks ...*types.Task) error
	DeletePolicies(ctx context.Context, policies ...*types.Policy) error
	DeleteRules(ctx context.Context, rules ...*types.Rule) error
	DeleteTasks(ctx context.Context, tasks ...*types.Task) error
	GetPolicyByID(ctx context.Context, id string) (*types.Policy, error)
	GetRuleByID(ctx context.Context, ruleID string, policyID string) (*types.Rule, error)
	GetTasksByAppID(ctx context.Context, appID string) ([]*types.Task, error)
	GetTasksByID(ctx context.Context, ids []string) ([]*types.Task, error)
	GetAllPolicies(
		ctx context.Context,
		paginationFilter pagination.PaginationFilter,
		query *string,
	) (*pagination.Pageable[types.Policy], error)
	GetAllRules(
		ctx context.Context,
		policyID string,
		paginationFilter pagination.PaginationFilter,
		query *string,
	) (*pagination.Pageable[types.Rule], error)
}
