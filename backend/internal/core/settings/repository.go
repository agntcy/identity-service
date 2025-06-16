// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package settings

import (
	"context"

	"github.com/agntcy/identity-platform/internal/core/settings/types"
)

type Repository interface {
	CreateSettings(
		ctx context.Context,
		settings *types.Settings,
	) (*types.Settings, error)
	GetSettings(
		ctx context.Context,
		id string,
	) (*types.Settings, error)
}
