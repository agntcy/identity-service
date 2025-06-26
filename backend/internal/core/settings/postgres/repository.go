// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"context"
	"errors"

	settingscore "github.com/agntcy/identity-platform/internal/core/settings"
	"github.com/agntcy/identity-platform/internal/core/settings/types"
	identitycontext "github.com/agntcy/identity-platform/internal/pkg/context"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/pkg/db"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type repository struct {
	dbContext db.Context
}

// NewRepository creates a new instance of the Repository
func NewRepository(dbContext db.Context) settingscore.Repository {
	return &repository{
		dbContext,
	}
}

// UpdateIssuerSettings updates the issuer settings in the database.
func (r *repository) UpdateIssuerSettings(
	ctx context.Context,
	issuerSettings *types.IssuerSettings,
) (*types.IssuerSettings, error) {
	existingSettings, err := r.getOrCreateIssuerSettings(ctx)
	if err != nil {
		return nil, errutil.Err(
			err, "failed to get or create issuer settings",
		)
	}

	// Update the existing settings with the new values
	model := newIssuerSettingsModel(issuerSettings)
	existingSettings.IdpType = model.IdpType
	existingSettings.IssuerID = model.IssuerID
	existingSettings.KeyID = model.KeyID

	// Update based on the IDP type
	switch model.IdpType {
	case types.IDP_TYPE_DUO:
		existingSettings.DuoIdpSettings = model.DuoIdpSettings
	case types.IDP_TYPE_OKTA:
		existingSettings.OktaIdpSettings = model.OktaIdpSettings
	}

	updated := r.dbContext.Client().
		Where("tenant_id = ?", existingSettings.TenantID).
		Updates(existingSettings)
	if updated.Error != nil {
		return nil, errutil.Err(
			updated.Error, "there was an error updating the settings",
		)
	}

	return model.ToCoreType(), nil
}

func (r *repository) GetIssuerSettings(
	ctx context.Context,
) (*types.IssuerSettings, error) {
	issuerSettings, err := r.getOrCreateIssuerSettings(ctx)
	if err != nil {
		return nil, errutil.Err(
			err, "failed to get or create issuer settings",
		)
	}

	return issuerSettings.ToCoreType(), nil
}

func (r *repository) getOrCreateIssuerSettings(
	ctx context.Context,
) (*IssuerSettings, error) {
	var issuerSettings IssuerSettings

	// Get the tenant ID from the context
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return nil, errutil.Err(
			nil, "failed to get tenant ID from context",
		)
	}

	result := r.dbContext.Client().
		Preload(clause.Associations).
		First(&issuerSettings, map[string]any{
			"tenant_id": tenantID,
		})
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			// Create a new IssuerSettings if not found
			model := newIssuerSettingsModel(&types.IssuerSettings{})
			model.TenantID = tenantID

			inserted := r.dbContext.Client().Create(model)
			if inserted.Error != nil {
				return nil, errutil.Err(
					inserted.Error, "there was an error creating the settings",
				)
			}

			// Return the newly created settings
			return model, nil
		}

		return nil, errutil.Err(
			result.Error, "there was an error fetching the settings",
		)
	}

	return &issuerSettings, nil
}
