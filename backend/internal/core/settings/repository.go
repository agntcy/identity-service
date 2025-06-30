// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package settings

import (
	"context"

	"github.com/agntcy/identity-platform/internal/core/settings/types"
)

type Repository interface {
	UpdateIssuerSettings(
		ctx context.Context,
		issuerSettings *types.IssuerSettings,
	) (*types.IssuerSettings, error)
	GetIssuerSettings(
		ctx context.Context,
	) (*types.IssuerSettings, error)
	AddDevice(
		ctx context.Context,
		device *types.Device,
	) (*types.Device, error)
	GetDevices(
		ctx context.Context,
		userID *string,
	) ([]*types.Device, error)
}
