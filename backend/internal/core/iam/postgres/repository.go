// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"context"
	"errors"
	"fmt"

	iamcore "github.com/agntcy/identity-service/internal/core/iam"
	"github.com/agntcy/identity-service/internal/core/iam/types"
	identitycontext "github.com/agntcy/identity-service/internal/pkg/context"
	"github.com/agntcy/identity-service/internal/pkg/gormutil"
	"github.com/agntcy/identity-service/internal/pkg/ptrutil"
	"github.com/agntcy/identity-service/internal/pkg/secrets"
	"gorm.io/gorm"
)

type repository struct {
	dbContext *gorm.DB
	crypter   secrets.Crypter
}

// NewRepository creates a new instance of the Repository
func NewRepository(dbContext *gorm.DB, crypter secrets.Crypter) iamcore.Repository {
	return &repository{
		dbContext,
		crypter,
	}
}

func (r *repository) AddAPIKey(
	ctx context.Context,
	apiKey *types.APIKey,
) (*types.APIKey, error) {
	model := newAPIKeyModel(apiKey, r.crypter)
	if model == nil {
		return nil, fmt.Errorf("API key is required")
	}

	// Get the tenant ID from the context
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return nil, identitycontext.ErrTenantNotFound
	}

	model.TenantID = tenantID

	// Make the API Keys unique for the tenant and the app
	// Enforce uniqueness on (tenant_id, app_id)
	inserted := r.dbContext.
		Attrs(&APIKey{
			TenantID: model.TenantID,
			AppID:    model.AppID,
		}).FirstOrCreate(model)
	if inserted.Error != nil {
		return nil, fmt.Errorf("there was an error adding the API key: %w", inserted.Error)
	}

	return model.ToCoreType(r.crypter), nil
}

func (r *repository) GetAPIKeyByTenant(
	ctx context.Context,
) (*types.APIKey, error) {
	var apiKey APIKey

	// The tenant API key is the one without an associated app
	result := r.dbContext.
		Scopes(gormutil.BelongsToTenant(ctx)).
		Where("app_id IS NULL").
		First(&apiKey)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, iamcore.ErrApiKeyNotFound
		}

		return nil, fmt.Errorf("unable to get API key by tenant: %w", result.Error)
	}

	return apiKey.ToCoreType(r.crypter), nil
}

func (r *repository) GetAPIKeyByApp(
	ctx context.Context,
	appID string,
) (*types.APIKey, error) {
	if appID == "" {
		return nil, errors.New("appID is required")
	}

	var apiKey APIKey

	result := r.dbContext.
		Scopes(gormutil.BelongsToTenant(ctx)).
		Where("app_id = ?", appID).
		First(&apiKey)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, iamcore.ErrApiKeyNotFound
		}

		return nil, fmt.Errorf("unable to get API key by app: %w", result.Error)
	}

	return apiKey.ToCoreType(r.crypter), nil
}

func (r *repository) GetAPIKeyBySecret(
	ctx context.Context,
	secret string,
) (*types.APIKey, error) {
	if secret == "" {
		return nil, errors.New("secret is required")
	}

	var apiKey APIKey

	result := r.dbContext.
		Scopes(gormutil.BelongsToTenant(ctx)).
		Where("secret = ?", secrets.NewEncryptedString(ptrutil.Ptr(secret), r.crypter)).
		First(&apiKey)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, iamcore.ErrApiKeyNotFound
		}

		return nil, fmt.Errorf("unable to get API key by secret: %w", result.Error)
	}

	return apiKey.ToCoreType(r.crypter), nil
}

func (r *repository) DeleteAPIKey(ctx context.Context, apiKey *types.APIKey) error {
	// This will make a soft delete since the entity has a DeletedAt field
	// https://gorm.io/docs/delete.html#Soft-Delete
	err := r.dbContext.
		Scopes(gormutil.BelongsToTenant(ctx)).
		Delete(newAPIKeyModel(apiKey, r.crypter)).Error
	if err != nil {
		return fmt.Errorf("cannot delete API key %s: %w", apiKey.ID, err)
	}

	return nil
}
