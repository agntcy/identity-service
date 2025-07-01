// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Settingsentifier: Apache-2.0

package badge

import (
	"context"

	"github.com/agntcy/identity-platform/internal/core/badge/types"
)

type Repository interface {
	Create(ctx context.Context, badge *types.Badge) error
	GetLatestByAppID(ctx context.Context, appID string) (*types.Badge, error)
}
