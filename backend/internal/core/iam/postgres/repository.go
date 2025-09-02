// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"context"
	"errors"
	"fmt"

	iamcore "github.com/outshift/identity-service/internal/core/iam"
	"github.com/outshift/identity-service/internal/core/iam/types"
	identitycontext "github.com/outshift/identity-service/internal/pkg/context"
	"github.com/outshift/identity-service/internal/pkg/errutil"
	"gorm.io/gorm"
)

type repository struct {
	dbContext *gorm.DB
}

// NewRepository creates a new instance of the Repository
func NewRepository(dbContext *gorm.DB) iamcore.Repository {
	return &repository{
		dbContext,
	}
}

func (r *repository) AddAPIKey(
	ctx context.Context,
	apiKey *types.APIKey,
) (*types.APIKey, error) {
	model := newAPIKeyModel(apiKey)
	if model == nil {
		return nil, errutil.Err(
			errors.New("APIKey cannot be nil"), "APIKey is required",
		)
	}

	// Get the tenant ID from the context
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return nil, identitycontext.ErrTenantNotFound
	}

	model.TenantID = tenantID

	inserted := r.dbContext.Create(model)
	if inserted.Error != nil {
		return nil, errutil.Err(
			inserted.Error, "there was an error adding the APIKey",
		)
	}

	return model.ToCoreType(), nil
}

func (r *repository) GetAPIKey(
	ctx context.Context,
	apiKeyID string,
) (*types.APIKey, error) {
	if apiKeyID == "" {
		return nil, errutil.Err(
			errors.New("APIKey ID cannot be empty"), "APIKey ID is required",
		)
	}

	var apiKey APIKey

	result := r.dbContext.
		Where("id = ?", apiKeyID).
		First(&apiKey)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errutil.Err(
				result.Error, "APIKey not found",
			)
		}

		return nil, errutil.Err(
			result.Error, "there was an error fetching the APIKey",
		)
	}

	return apiKey.ToCoreType(), nil
}

func (r *repository) DeleteAPIKey(ctx context.Context, apiKey *types.APIKey) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return identitycontext.ErrTenantNotFound
	}

	// This will make a soft delete since the entity has a DeletedAt field
	// https://gorm.io/docs/delete.html#Soft-Delete
	err := r.dbContext.
		Where("tenant_id = ?", tenantID).
		Delete(newAPIKeyModel(apiKey)).Error
	if err != nil {
		return errutil.Err(err, fmt.Sprintf("cannot delete APIKey %s", apiKey.ID))
	}

	return nil
}
