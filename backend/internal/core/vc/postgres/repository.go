// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"context"

	vccore "github.com/agntcy/identity-platform/internal/core/vc"
	"github.com/agntcy/identity-platform/internal/core/vc/types"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/pkg/db"
)

type vcPostgresRepository struct {
	dbContext db.Context
}

func NewRepository(dbContext db.Context) vccore.Repository {
	return &vcPostgresRepository{
		dbContext: dbContext,
	}
}

func (r *vcPostgresRepository) Create(
	ctx context.Context,
	credential *types.VerifiableCredential,
	resolverMetadataID string,
) (*types.VerifiableCredential, error) {
	model := newVerifiableCredentialModel(credential, resolverMetadataID)

	result := r.dbContext.Client().Create(model)
	if result.Error != nil {
		return nil, errutil.Err(
			result.Error, "there was an error creating the verifiable credential",
		)
	}

	return credential, nil
}

func (r *vcPostgresRepository) GetByResolverMetadata(
	ctx context.Context,
	resolverMetadataID string,
) ([]*types.VerifiableCredential, error) {
	var storedVCs []*VerifiableCredential

	result := r.dbContext.Client().
		Model(&VerifiableCredential{}).
		Where("resolver_metadata_id = ?", resolverMetadataID).
		Find(&storedVCs)
	if result.Error != nil {
		return nil, errutil.Err(
			result.Error, "there was an error fetching the verifiable credentials",
		)
	}

	vcs := make([]*types.VerifiableCredential, 0, len(storedVCs))
	for _, vc := range storedVCs {
		vcs = append(vcs, vc.ToCoreType())
	}

	return vcs, nil
}
