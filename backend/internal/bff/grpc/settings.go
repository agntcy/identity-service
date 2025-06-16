// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Settingsentifier: Apache-2.0

package grpc

import (
	identity_platform_sdk_go "github.com/agntcy/identity-platform/api/server/agntcy/identity/platform/v1alpha1"
	"github.com/agntcy/identity-platform/internal/bff"
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
