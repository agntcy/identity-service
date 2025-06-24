// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Settingsentifier: Apache-2.0

package bff

import (
	"context"

	issuercore "github.com/agntcy/identity-platform/internal/core/issuer"
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
	issuerSrv          issuercore.Service
	iamClient          outshiftiam.Client
	settingsRepository settingscore.Repository
}

func NewSettingsService(
	issuerSrv issuercore.Service,
	iamClient outshiftiam.Client,
	settingsRepository settingscore.Repository,
) SettingsService {
	return &settingsService{
		issuerSrv:          issuerSrv,
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
	existingSettings, err := s.settingsRepository.GetIssuerSettings(ctx)
	if err == nil && existingSettings.IssuerID != "" {
		return nil, errutil.Err(
			nil,
			"updating existing issuer settings is not supported",
		)
	}

	// Set the issuer id based on the issuer settings.
	err = s.issuerSrv.SetIssuer(ctx, issuerSettings)
	if err != nil {
		return nil, errutil.Err(err, "failed to set issuer settings")
	}

	// Update the issuer settings in the repository.
	updatedSettings, err := s.settingsRepository.UpdateIssuerSettings(ctx, issuerSettings)
	if err != nil {
		return nil, err
	}

	return updatedSettings, nil
}
