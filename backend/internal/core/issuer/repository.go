// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package issuer

import (
	"context"

	"github.com/agntcy/identity-platform/internal/core/issuer/types"
)

// Repository is the interface for the Issuer repository
type Repository interface {
	CreateIssuer(
		ctx context.Context,
		issuer *types.Issuer,
	) (*types.Issuer, error)
	GetIssuer(ctx context.Context, commonName string) (*types.Issuer, error)
}
