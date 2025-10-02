// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package badge

import (
	"context"
	"errors"

	"github.com/agntcy/identity-service/internal/core/badge/types"
)

type Repository interface {
	Create(ctx context.Context, badge *types.Badge) error
	Update(ctx context.Context, badge *types.Badge) error
	GetLatestByAppIdOrResolverMetadataID(ctx context.Context, id string) (*types.Badge, error)
	GetAllActiveBadges(ctx context.Context, appID string) ([]*types.Badge, error)
}

var ErrBadgeNotFound = errors.New("badge not found")
