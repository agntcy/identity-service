// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package device

import (
	"context"

	"github.com/agntcy/identity-platform/internal/core/device/types"
)

type Repository interface {
	AddDevice(
		ctx context.Context,
		device *types.Device,
	) (*types.Device, error)
	GetDevice(
		ctx context.Context,
		deviceID string,
	) (*types.Device, error)
	GetDevices(
		ctx context.Context,
		userID *string,
	) ([]*types.Device, error)
	UpdateDevice(
		ctx context.Context,
		device *types.Device,
	) (*types.Device, error)
}
