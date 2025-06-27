// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package policy

import (
	"context"

	"github.com/agntcy/identity-platform/internal/core/policy/types"
)

type Repository interface {
	Create(ctx context.Context, policy *types.Policy) error
	CreateRule(ctx context.Context, rule *types.Rule) error
	CreateTasks(ctx context.Context, tasks ...*types.Task) error
	UpdateTasks(ctx context.Context, tasks ...*types.Task) error
	DeleteTasks(ctx context.Context, tasks ...*types.Task) error
	GetTasksByAppID(ctx context.Context, appID string) ([]*types.Task, error)
	GetTasksByID(ctx context.Context, ids []string) ([]*types.Task, error)
}
