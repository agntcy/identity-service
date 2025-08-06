// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package app

import (
	"context"

	"github.com/outshift/identity-service/internal/core/app/types"
	"github.com/outshift/identity-service/internal/pkg/pagination"
	"github.com/outshift/identity-service/internal/pkg/sorting"
)

type Repository interface {
	CreateApp(
		ctx context.Context,
		app *types.App,
	) (*types.App, error)
	UpdateApp(ctx context.Context, app *types.App) error
	GetApp(
		ctx context.Context,
		id string,
	) (*types.App, error)
	GetAllApps(
		ctx context.Context,
		paginationFilter pagination.PaginationFilter,
		query *string,
		appTypes []types.AppType,
		sortBy sorting.Sorting,
	) (*pagination.Pageable[types.App], error)
	CountAllApps(ctx context.Context) (int64, error)
	GetAppsByID(ctx context.Context, ids []string) ([]*types.App, error)
	DeleteApp(ctx context.Context, app *types.App) error
	GetAppStatuses(
		ctx context.Context,
		appIDs ...string,
	) (map[string]types.AppStatus, error)
}
