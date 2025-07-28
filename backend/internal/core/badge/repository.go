// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Settingsentifier: Apache-2.0

package badge

import (
	"context"

	"github.com/outshift/identity-service/internal/core/badge/types"
)

type Repository interface {
	Create(ctx context.Context, badge *types.Badge) error
	Update(ctx context.Context, badge *types.Badge) error
	GetLatestByAppID(ctx context.Context, appID string) (*types.Badge, error)
	GetAllActiveBadges(ctx context.Context, appID string) ([]*types.Badge, error)
}
