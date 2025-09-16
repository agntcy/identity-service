// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package policy

import (
	"context"

	apptypes "github.com/outshift/identity-service/internal/core/app/types"
	"github.com/outshift/identity-service/internal/core/policy/types"
	"github.com/outshift/identity-service/internal/pkg/pagination"
)

type Repository interface {
	Create(ctx context.Context, policy *types.Policy) error
	CreateRule(ctx context.Context, rule *types.Rule) error
	CreateTasks(ctx context.Context, tasks ...*types.Task) error
	UpdatePolicy(ctx context.Context, policy *types.Policy) error
	UpdateRule(ctx context.Context, rule *types.Rule) error
	UpdateTasks(ctx context.Context, tasks ...*types.Task) error
	DeletePolicies(ctx context.Context, policies ...*types.Policy) error
	DeletePoliciesByAppID(ctx context.Context, appID string) error
	DeleteRules(ctx context.Context, rules ...*types.Rule) error
	DeleteTasks(ctx context.Context, tasks ...*types.Task) error
	DeleteTasksByAppID(ctx context.Context, appID string) error
	GetPolicyByID(ctx context.Context, id string) (*types.Policy, error)
	GetPoliciesByAppID(ctx context.Context, appID string) ([]*types.Policy, error)
	GetRuleByID(ctx context.Context, ruleID string, policyID string) (*types.Rule, error)
	GetTasksByAppID(ctx context.Context, appID string) ([]*types.Task, error)
	GetTasksPerAppType(
		ctx context.Context,
		excludeAppIDs ...string,
	) (map[apptypes.AppType][]*types.Task, error)
	GetTasksByID(ctx context.Context, ids []string) ([]*types.Task, error)
	GetAllPolicies(
		ctx context.Context,
		paginationFilter pagination.PaginationFilter,
		query *string,
		appIDs []string,
		rulesForAppIDs []string,
	) (*pagination.Pageable[types.Policy], error)
	GetAllRules(
		ctx context.Context,
		policyID string,
		paginationFilter pagination.PaginationFilter,
		query *string,
	) (*pagination.Pageable[types.Rule], error)
	CountAllPolicies(ctx context.Context) (int64, error)
}
