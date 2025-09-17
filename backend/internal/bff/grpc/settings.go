// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Settingsentifier: Apache-2.0

package grpc

import (
	"context"

	identity_service_sdk_go "github.com/outshift/identity-service/api/server/outshift/identity/service/v1alpha1"
	"github.com/outshift/identity-service/internal/bff"
	"github.com/outshift/identity-service/internal/bff/grpc/converters"
	"github.com/outshift/identity-service/internal/pkg/grpcutil"
)

type settingsService struct {
	settingsSrv bff.SettingsService
}

func NewSettingsService(
	settingsSrv bff.SettingsService,
) identity_service_sdk_go.SettingsServiceServer {
	return &settingsService{
		settingsSrv: settingsSrv,
	}
}

func (s *settingsService) GetSettings(
	ctx context.Context,
	req *identity_service_sdk_go.GetSettingsRequest,
) (*identity_service_sdk_go.Settings, error) {
	settings, err := s.settingsSrv.GetSettings(ctx)
	if err != nil {
		return nil, grpcutil.Error(err)
	}

	return &identity_service_sdk_go.Settings{
		IssuerSettings: converters.FromIssuerSettings(settings.IssuerSettings),
		ApiKey:         converters.FromApiKey(settings.ApiKey),
	}, nil
}

func (s *settingsService) SetApiKey(
	ctx context.Context,
	req *identity_service_sdk_go.SetApiKeyRequest,
) (*identity_service_sdk_go.ApiKey, error) {
	apiKey, err := s.settingsSrv.SetApiKey(ctx)
	if err != nil {
		return nil, grpcutil.Error(err)
	}

	return converters.FromApiKey(apiKey), nil
}

func (s *settingsService) SetIssuer(
	ctx context.Context,
	req *identity_service_sdk_go.SetIssuerRequest,
) (*identity_service_sdk_go.IssuerSettings, error) {
	issuerSettings := converters.ToIssuerSettings(req.GetIssuerSettings())

	updatedIssuerSettings, err := s.settingsSrv.SetIssuerSettings(ctx, issuerSettings)
	if err != nil {
		return nil, grpcutil.Error(err)
	}

	return converters.FromIssuerSettings(updatedIssuerSettings), nil
}
