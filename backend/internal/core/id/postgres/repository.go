// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"context"
	"errors"

	errcore "github.com/agntcy/identity-platform/internal/core/errors"
	idcore "github.com/agntcy/identity-platform/internal/core/id"
	idtypes "github.com/agntcy/identity-platform/internal/core/id/types"
	issuertypes "github.com/agntcy/identity-platform/internal/core/issuer/types"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/pkg/db"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type idPostgresRepository struct {
	dbContext db.Context
}

func NewIdRepository(dbContext db.Context) idcore.IdRepository {
	return &idPostgresRepository{
		dbContext: dbContext,
	}
}

func (r *idPostgresRepository) CreateID(
	ctx context.Context,
	metadata *idtypes.ResolverMetadata,
	issuer *issuertypes.Issuer,
) (*idtypes.ResolverMetadata, error) {
	model := newResolverMetadataModel(metadata, issuer)

	result := r.dbContext.Client().Create(model)
	if result.Error != nil {
		return nil, errutil.Err(
			result.Error, "there was an error creating the resolver metadata",
		)
	}

	return metadata, nil
}

func (r *idPostgresRepository) ResolveID(
	ctx context.Context,
	id string,
) (*idtypes.ResolverMetadata, error) {
	var metadata ResolverMetadata

	result := r.dbContext.Client().
		Model(&ResolverMetadata{}).
		Preload(clause.Associations).
		First(&metadata, "id = ?", id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errcore.ErrResourceNotFound
		}

		return nil, errutil.Err(
			result.Error, "there was an error fetching the resolver metadata",
		)
	}

	return metadata.ToCoreType(), nil
}
