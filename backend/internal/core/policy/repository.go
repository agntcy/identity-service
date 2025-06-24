// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package policy

import (
	"context"

	"github.com/agntcy/identity-platform/internal/core/policy/types"
)

type Repository interface {
	Create(ctx context.Context, policy *types.Policy) error
}
