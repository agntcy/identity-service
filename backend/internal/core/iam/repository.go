// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package iam

import (
	"context"
	"errors"

	"github.com/agntcy/identity-service/internal/core/iam/types"
)

type Repository interface {
	AddAPIKey(
		ctx context.Context,
		APIKey *types.APIKey,
	) (*types.APIKey, error)
	GetAPIKeyByTenant(
		ctx context.Context,
	) (*types.APIKey, error)
	GetAPIKeyByApp(
		ctx context.Context,
		appID string,
	) (*types.APIKey, error)
	GetAPIKeyBySecret(
		ctx context.Context,
		appSecret string,
	) (*types.APIKey, error)
	DeleteAPIKey(ctx context.Context, APIKey *types.APIKey) error
}

var (
	ErrApiKeyNotFound = errors.New("API Key not found")
)
