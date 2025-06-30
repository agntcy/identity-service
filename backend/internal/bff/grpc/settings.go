// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Settingsentifier: Apache-2.0

package grpc

import (
	"context"

	identity_platform_sdk_go "github.com/agntcy/identity-platform/api/server/agntcy/identity/platform/v1alpha1"
	"github.com/agntcy/identity-platform/internal/bff"
	"github.com/agntcy/identity-platform/internal/bff/grpc/converters"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/internal/pkg/grpcutil"
	"google.golang.org/protobuf/types/known/emptypb"
)

type settingsService struct {
	settingsSrv bff.SettingsService
}

func NewSettingsService(
	settingsSrv bff.SettingsService,
) identity_platform_sdk_go.SettingsServiceServer {
	return &settingsService{
		settingsSrv: settingsSrv,
	}
}

func (s *settingsService) GetSettings(
	ctx context.Context,
	req *identity_platform_sdk_go.GetSettingsRequest,
) (*identity_platform_sdk_go.Settings, error) {
	settings, err := s.settingsSrv.GetSettings(ctx)
	if err != nil {
		return nil, err
	}

	return &identity_platform_sdk_go.Settings{
		IssuerSettings: converters.FromIssuerSettings(settings.IssuerSettings),
		ApiKey:         converters.FromApiKey(settings.ApiKey),
	}, nil
}

func (s *settingsService) SetApiKey(
	ctx context.Context,
	req *identity_platform_sdk_go.SetApiKeyRequest,
) (*identity_platform_sdk_go.ApiKey, error) {
	apiKey, err := s.settingsSrv.SetApiKey(ctx)
	if err != nil {
		return nil, err
	}

	return converters.FromApiKey(apiKey), nil
}

func (s *settingsService) SetIssuer(
	ctx context.Context,
	req *identity_platform_sdk_go.SetIssuerRequest,
) (*identity_platform_sdk_go.IssuerSettings, error) {
	issuerSettings := converters.ToIssuerSettings(req.GetIssuerSettings())
	if issuerSettings == nil {
		return nil, errutil.Err(nil, "issuer settings cannot be nil")
	}

	updatedIssuerSettings, err := s.settingsSrv.SetIssuerSettings(ctx, issuerSettings)
	if err != nil {
		return nil, err
	}

	return converters.FromIssuerSettings(updatedIssuerSettings), nil
}

func (s *settingsService) AddDevice(
	ctx context.Context,
	req *identity_platform_sdk_go.AddDeviceRequest,
) (*emptypb.Empty, error) {
	return nil, grpcutil.UnauthorizedError(errutil.Err(
		nil,
		"RegisterDevice method is not implemented",
	))
}
