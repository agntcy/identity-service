// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package iam

import (
	"context"

	"github.com/outshift/identity-service/internal/core/iam/types"
)

type Repository interface {
	AddAPIKey(
		ctx context.Context,
		APIKey *types.APIKey,
	) (*types.APIKey, error)
	GetAPIKey(
		ctx context.Context,
		APIKeyID string,
	) (*types.APIKey, error)
	DeleteAPIKey(ctx context.Context, APIKey *types.APIKey) error
}
