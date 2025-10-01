// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package policy

import (
	"context"
	"errors"

	apptypes "github.com/outshift/identity-service/internal/core/app/types"
	"github.com/outshift/identity-service/internal/core/policy/types"
	"github.com/outshift/identity-service/internal/pkg/pagination"
)

type PolicyRepository interface {
	Create(ctx context.Context, policy *types.Policy) error
	Update(ctx context.Context, policy *types.Policy) error
	Delete(ctx context.Context, policies ...*types.Policy) error
	DeleteByAppID(ctx context.Context, appID string) error
	GetByID(ctx context.Context, id string) (*types.Policy, error)
	GetByAppID(ctx context.Context, appID string) ([]*types.Policy, error)
	GetAll(
		ctx context.Context,
		paginationFilter pagination.PaginationFilter,
		query *string,
		appIDs []string,
		rulesForAppIDs []string,
	) (*pagination.Pageable[types.Policy], error)
	CountAll(ctx context.Context) (int64, error)
}

type RuleRepository interface {
	Create(ctx context.Context, rule *types.Rule) error
	Update(ctx context.Context, rule *types.Rule) error
	Delete(ctx context.Context, rules ...*types.Rule) error
	GetByID(ctx context.Context, ruleID string, policyID string) (*types.Rule, error)
	GetAll(
		ctx context.Context,
		policyID string,
		paginationFilter pagination.PaginationFilter,
		query *string,
	) (*pagination.Pageable[types.Rule], error)
}

type TaskRepository interface {
	Create(ctx context.Context, tasks ...*types.Task) error
	Update(ctx context.Context, tasks ...*types.Task) error
	Delete(ctx context.Context, tasks ...*types.Task) error
	DeleteByAppID(ctx context.Context, appID string) error
	GetByAppID(ctx context.Context, appID string) ([]*types.Task, error)
	GetPerAppType(
		ctx context.Context,
		excludeAppIDs ...string,
	) (map[apptypes.AppType][]*types.Task, error)
	GetByID(ctx context.Context, ids []string) ([]*types.Task, error)
}

var (
	ErrPolicyNotFound = errors.New("policy not found")
	ErrRuleNotFound   = errors.New("rule not found")
	ErrTaskNotFound   = errors.New("task not found")
)
