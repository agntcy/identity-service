// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package iam

import (
	"context"

	"github.com/outshift/identity-service/internal/core/iam/types"
)

type Client interface {
	AuthJwt(
		ctx context.Context,
		header string,
	) (newCtx context.Context, err error)
	AuthAPIKey(
		ctx context.Context,
		productID string,
		apiKey string,
		forApp bool,
	) (newCtx context.Context, err error)
	GetTenantAPIKey(ctx context.Context) (apiKey types.APIKey, err error)
	GetAppAPIKey(ctx context.Context, appID string) (apiKey types.APIKey, err error)
	RefreshAppAPIKey(ctx context.Context, appID string) (apiKey types.APIKey, err error)
	CreateTenantAPIKey(ctx context.Context) (apiKey types.APIKey, err error)
	CreateAppAPIKey(ctx context.Context, appID string) (apiKey types.APIKey, err error)
	RevokeTenantAPIKey(ctx context.Context) (err error)
	RevokeAppAPIKey(ctx context.Context, appID string) (err error)
}
