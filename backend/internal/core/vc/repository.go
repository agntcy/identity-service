// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package vc

import (
	"context"

	"github.com/agntcy/identity-saas/internal/core/vc/types"
)

type Repository interface {
	Create(
		ctx context.Context,
		credential *types.VerifiableCredential,
		resolverMetadataID string,
	) (*types.VerifiableCredential, error)

	GetByResolverMetadata(
		ctx context.Context,
		resolverMetadataID string,
	) ([]*types.VerifiableCredential, error)
}
