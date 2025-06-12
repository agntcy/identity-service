// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package testing

import (
	"context"

	errcore "github.com/agntcy/identity-platform/internal/core/errors"
	idcore "github.com/agntcy/identity-platform/internal/core/id"
	idtypes "github.com/agntcy/identity-platform/internal/core/id/types"
	issuertypes "github.com/agntcy/identity-platform/internal/core/issuer/types"
)

type FakeIdRepository struct {
	store map[string]*idtypes.ResolverMetadata
}

func NewFakeIdRepository() idcore.IdRepository {
	return &FakeIdRepository{
		store: make(map[string]*idtypes.ResolverMetadata),
	}
}

func (r *FakeIdRepository) CreateID(
	ctx context.Context,
	metadata *idtypes.ResolverMetadata,
	issuer *issuertypes.Issuer,
) (*idtypes.ResolverMetadata, error) {
	r.store[metadata.ID] = metadata
	return metadata, nil
}

func (r *FakeIdRepository) ResolveID(
	ctx context.Context,
	id string,
) (*idtypes.ResolverMetadata, error) {
	if md, ok := r.store[id]; ok {
		return md, nil
	}

	return nil, errcore.ErrResourceNotFound
}
