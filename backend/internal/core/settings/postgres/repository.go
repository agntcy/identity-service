// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"context"
	"errors"
	"fmt"

	settingscore "github.com/agntcy/identity-service/internal/core/settings"
	"github.com/agntcy/identity-service/internal/core/settings/types"
	identitycontext "github.com/agntcy/identity-service/internal/pkg/context"
	"github.com/agntcy/identity-service/internal/pkg/gormutil"
	"github.com/agntcy/identity-service/internal/pkg/secrets"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type repository struct {
	dbContext *gorm.DB
	crypter   secrets.Crypter
}

// NewRepository creates a new instance of the Repository
func NewRepository(dbContext *gorm.DB, crypter secrets.Crypter) settingscore.Repository {
	return &repository{
		dbContext,
		crypter,
	}
}

// UpdateIssuerSettings updates the issuer settings in the database.
func (r *repository) UpdateIssuerSettings(
	ctx context.Context,
	issuerSettings *types.IssuerSettings,
) (*types.IssuerSettings, error) {
	existingSettings, err := r.getOrCreateIssuerSettings(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get or create issuer settings: %w", err)
	}

	// Update the existing settings with the new values
	model := newIssuerSettingsModel(issuerSettings, r.crypter)
	existingSettings.IdpType = model.IdpType
	existingSettings.IssuerID = model.IssuerID
	existingSettings.KeyID = model.KeyID

	// Update based on the IDP type
	switch model.IdpType {
	case types.IDP_TYPE_DUO:
		existingSettings.DuoIdpSettings = model.DuoIdpSettings
	case types.IDP_TYPE_OKTA:
		existingSettings.OktaIdpSettings = model.OktaIdpSettings
	case types.IDP_TYPE_ORY:
		existingSettings.OryIdpSettings = model.OryIdpSettings
	}

	updated := r.dbContext.
		Scopes(gormutil.BelongsToTenant(ctx)).
		Updates(existingSettings)
	if updated.Error != nil {
		return nil, fmt.Errorf("there was an error updating the settings: %w", updated.Error)
	}

	return model.ToCoreType(r.crypter), nil
}

func (r *repository) GetIssuerSettings(
	ctx context.Context,
) (*types.IssuerSettings, error) {
	issuerSettings, err := r.getOrCreateIssuerSettings(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get or create issuer settings: %w", err)
	}

	return issuerSettings.ToCoreType(r.crypter), nil
}

func (r *repository) getOrCreateIssuerSettings(
	ctx context.Context,
) (*IssuerSettings, error) {
	var issuerSettings IssuerSettings

	// Get the tenant ID from the context
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return nil, identitycontext.ErrTenantNotFound
	}

	result := r.dbContext.
		Preload(clause.Associations).
		Scopes(gormutil.BelongsToTenant(ctx)).
		First(&issuerSettings)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			// Create a new IssuerSettings if not found
			model := newIssuerSettingsModel(&types.IssuerSettings{}, r.crypter)
			model.TenantID = tenantID

			inserted := r.dbContext.Create(model)
			if inserted.Error != nil {
				return nil, fmt.Errorf(
					"there was an error creating the settings: %w",
					inserted.Error,
				)
			}

			// Return the newly created settings
			return model, nil
		}

		return nil, fmt.Errorf(
			"there was an error fetching the settings: %w",
			result.Error,
		)
	}

	return &issuerSettings, nil
}
