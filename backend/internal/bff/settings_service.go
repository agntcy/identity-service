// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Settingsentifier: Apache-2.0

package bff

import (
	"context"

	settingscore "github.com/agntcy/identity-platform/internal/core/settings"
	settingstypes "github.com/agntcy/identity-platform/internal/core/settings/types"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
)

type SettingsService interface {
	GetSettings(ctx context.Context) (*settingstypes.Settings, error)
	SetApiKey(ctx context.Context) error
	SetIssuerSettings(
		ctx context.Context,
		issuerSettings *settingstypes.IssuerSettings,
	) (*settingstypes.IssuerSettings, error)
}

type settingsService struct {
	settingsRepository settingscore.Repository
}

func NewSettingsService(
	settingsRepository settingscore.Repository,
) SettingsService {
	return &settingsService{
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

	return &settingstypes.Settings{
		IssuerSettings: issuerSettings,
	}, nil
}

func (s *settingsService) SetApiKey(
	ctx context.Context,
) error {
	// This method is not implemented in the original code.
	// You can implement it based on your requirements.
	return nil
}

func (s *settingsService) SetIssuerSettings(
	ctx context.Context,
	issuerSettings *settingstypes.IssuerSettings,
) (*settingstypes.IssuerSettings, error) {
	if issuerSettings == nil {
		return nil, errutil.Err(nil, "issuer settings cannot be nil")
	}

	updatedSettings, err := s.settingsRepository.UpdateIssuerSettings(ctx, issuerSettings)
	if err != nil {
		return nil, err
	}

	return updatedSettings, nil
}
