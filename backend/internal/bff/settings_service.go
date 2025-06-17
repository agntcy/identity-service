// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Settingsentifier: Apache-2.0

package bff

import (
	"context"

	"github.com/agntcy/identity-platform/internal/core/idp"
	settingscore "github.com/agntcy/identity-platform/internal/core/settings"
	settingstypes "github.com/agntcy/identity-platform/internal/core/settings/types"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	outshiftiam "github.com/agntcy/identity-platform/internal/pkg/iam"
)

type SettingsService interface {
	GetSettings(ctx context.Context) (*settingstypes.Settings, error)
	SetApiKey(ctx context.Context) (*settingstypes.ApiKey, error)
	SetIssuerSettings(
		ctx context.Context,
		issuerSettings *settingstypes.IssuerSettings,
	) (*settingstypes.IssuerSettings, error)
}

type settingsService struct {
	iamClient          *outshiftiam.Client
	settingsRepository settingscore.Repository
}

func NewSettingsService(
	iamClient *outshiftiam.Client,
	settingsRepository settingscore.Repository,
) SettingsService {
	return &settingsService{
		iamClient:          iamClient,
		settingsRepository: settingsRepository,
	}
}

func (s *settingsService) GetSettings(
	ctx context.Context,
) (*settingstypes.Settings, error) {
	issuerSettings, err := s.settingsRepository.GetIssuerSettings(ctx)
	if err != nil {
		return nil, err
	}

	// Get the API key from the IAM client.
	apiKey, _ := s.iamClient.GetTenantApiKey(ctx)

	return &settingstypes.Settings{
		IssuerSettings: issuerSettings,
		ApiKey: &settingstypes.ApiKey{
			ApiKey: apiKey.Secret,
		},
	}, nil
}

func (s *settingsService) SetApiKey(
	ctx context.Context,
) (*settingstypes.ApiKey, error) {
	// Get existing key and revoke it if necessary.
	_, err := s.iamClient.GetTenantApiKey(ctx)
	if err == nil {
		if err := s.iamClient.RevokeTenantApiKey(ctx); err != nil {
			return nil, errutil.Err(err, "failed to revoke existing Api key")
		}
	}

	// Generate a new Api key.
	newApiKey, err := s.iamClient.CreateTenantApiKey(ctx)
	if err != nil {
		return nil, errutil.Err(err, "failed to create new Api key")
	}

	// Return the new Api key.
	return &settingstypes.ApiKey{
		ApiKey: newApiKey.Secret,
	}, nil
}

func (s *settingsService) SetIssuerSettings(
	ctx context.Context,
	issuerSettings *settingstypes.IssuerSettings,
) (*settingstypes.IssuerSettings, error) {
	if issuerSettings == nil {
		return nil, errutil.Err(nil, "issuer settings cannot be nil")
	}

	// Instantiate the IdP based on the issuer settings.
	idp, err := idp.NewIdp(
		issuerSettings)
	if err != nil {
		return nil, errutil.Err(err, "failed to create IdP instance")
	}

	// Test the IdP settings based on the type.
	if err := idp.TestSettings(ctx); err != nil {
		return nil, errutil.Err(err, "failed to test IdP settings")
	}

	// Update the issuer settings in the repository.
	updatedSettings, err := s.settingsRepository.UpdateIssuerSettings(ctx, issuerSettings)
	if err != nil {
		return nil, err
	}

	return updatedSettings, nil
}
