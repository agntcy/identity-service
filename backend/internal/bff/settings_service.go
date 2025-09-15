// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Settingsentifier: Apache-2.0

package bff

import (
	"context"

	iamtypes "github.com/outshift/identity-service/internal/core/iam/types"
	issuercore "github.com/outshift/identity-service/internal/core/issuer"
	settingscore "github.com/outshift/identity-service/internal/core/settings"
	settingstypes "github.com/outshift/identity-service/internal/core/settings/types"
	"github.com/outshift/identity-service/internal/pkg/errutil"
	"github.com/outshift/identity-service/internal/pkg/iam"
	"github.com/outshift/identity-service/internal/pkg/ptrutil"
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
	iamClient          iam.Client
	settingsRepository settingscore.Repository
}

func NewSettingsService(
	issuerSrv issuercore.Service,
	iamClient iam.Client,
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
	apiKey, _ := s.iamClient.GetTenantAPIKey(ctx)
	if apiKey == nil {
		apiKey = &iamtypes.APIKey{}
	}

	return &settingstypes.Settings{
		IssuerSettings: issuerSettings,
		ApiKey: &settingstypes.ApiKey{
			ApiKey: ptrutil.DerefStr(apiKey.Secret),
		},
	}, nil
}

func (s *settingsService) SetApiKey(
	ctx context.Context,
) (*settingstypes.ApiKey, error) {
	// Get existing key and revoke it if necessary.
	_, err := s.iamClient.GetTenantAPIKey(ctx)
	if err == nil {
		if err := s.iamClient.RevokeTenantAPIKey(ctx); err != nil {
			return nil, errutil.Err(err, "failed to revoke existing Api key")
		}
	}

	// Generate a new Api key.
	newApiKey, err := s.iamClient.CreateTenantAPIKey(ctx)
	if err != nil {
		return nil, errutil.Err(err, "failed to create new Api key")
	}

	// Return the new Api key.
	return &settingstypes.ApiKey{
		ApiKey: ptrutil.DerefStr(newApiKey.Secret),
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
