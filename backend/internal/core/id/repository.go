// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package id

import (
	"context"

	"github.com/agntcy/identity-platform/internal/core/id/types"
	issuertypes "github.com/agntcy/identity-platform/internal/core/issuer/types"
)

type IdRepository interface {
	CreateID(
		ctx context.Context,
		metadata *types.ResolverMetadata,
		issuer *issuertypes.Issuer,
	) (*types.ResolverMetadata, error)
	ResolveID(ctx context.Context, id string) (*types.ResolverMetadata, error)
}
