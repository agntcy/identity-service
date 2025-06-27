// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package app

import (
	"context"

	"github.com/agntcy/identity-platform/internal/core/app/types"
	"github.com/agntcy/identity-platform/internal/pkg/pagination"
)

type Repository interface {
	CreateApp(
		ctx context.Context,
		app *types.App,
	) (*types.App, error)
	GetApp(
		ctx context.Context,
		id string,
	) (*types.App, error)
	GetAllApps(
		ctx context.Context,
		paginationFilter pagination.PaginationFilter,
		query *string,
		appType *types.AppType,
	) (*pagination.Pageable[types.App], error)
}
