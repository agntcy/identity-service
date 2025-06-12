// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package id

import (
	"context"

	"github.com/agntcy/identity-platform/internal/core/app/types"
	"github.com/agntcy/identity-platform/internal/pkg/pagination"
)

type AppRepository interface {
	GetApps(
		ctx context.Context,
		paginationFilter pagination.PaginationFilter,
		query *string,
	) (*pagination.Pageable[types.App], error)
	CreateApp(
		ctx context.Context,
		app *types.App,
	) (*types.App, error)
	GetApp(
		ctx context.Context,
		id string,
		withFields ...string,
	) (*types.App, error)
	GetAppByCatalogID(
		ctx context.Context,
		catalogID string,
	) (*types.App, error)
	UpdateApp(
		ctx context.Context,
		app *types.App,
	) (*types.App, error)
	DeleteApp(ctx context.Context, id string) error
}
