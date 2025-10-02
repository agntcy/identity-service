// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package bff

import (
	"context"
	"fmt"

	iamtypes "github.com/agntcy/identity-service/internal/core/iam/types"
	settingscore "github.com/agntcy/identity-service/internal/core/settings"
	settingstypes "github.com/agntcy/identity-service/internal/core/settings/types"
	"github.com/agntcy/identity-service/internal/pkg/errutil"
	"github.com/agntcy/identity-service/internal/pkg/iam"
	"github.com/agntcy/identity-service/internal/pkg/ptrutil"
	"github.com/agntcy/identity-service/pkg/log"
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
	issuerSrv          settingscore.IssuerService
	iamClient          iam.Client
	settingsRepository settingscore.Repository
}

func NewSettingsService(
	issuerSrv settingscore.IssuerService,
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
		return nil, fmt.Errorf("repository in GetSettings failed to fetch issuer settings: %w", err)
	}

	// Get the API key from the IAM client.
	apiKey, err := s.iamClient.GetTenantAPIKey(ctx)
	if err != nil {
		log.FromContext(ctx).
			WithError(err).
			Warn("iam client in GetSettings failed to get tenant API key")
	}

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
			return nil, fmt.Errorf("failed to revoke existing Api key: %w", err)
		}
	} else {
		log.FromContext(ctx).
			WithError(err).
			Warn("iam client in SetApiKey failed to get tenant API key")
	}

	// Generate a new Api key.
	newApiKey, err := s.iamClient.CreateTenantAPIKey(ctx)
	if err != nil {
		return nil, fmt.Errorf("iam client in SetApiKey failed to create new Api key: %w", err)
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
	if issuerSettings == nil {
		return nil, errutil.ValidationFailed("settings.invalidPayload", "Invalid issuer settings payload.")
	}

	existingSettings, err := s.settingsRepository.GetIssuerSettings(ctx)
	if err == nil && existingSettings.IssuerID != "" {
		return nil, errutil.InvalidRequest(
			"settings.updateNotSupported",
			"Updating existing issuer settings is not supported.",
		)
	}

	// Set the issuer id based on the issuer settings.
	err = s.issuerSrv.SetIssuer(ctx, issuerSettings)
	if err != nil {
		return nil, fmt.Errorf("issuer service in SetIssuer failed to set issuer settings: %w", err)
	}

	// Update the issuer settings in the repository.
	updatedSettings, err := s.settingsRepository.UpdateIssuerSettings(ctx, issuerSettings)
	if err != nil {
		return nil, fmt.Errorf("repository in SetIssuer failed to update issuer settings: %w", err)
	}

	return updatedSettings, nil
}
