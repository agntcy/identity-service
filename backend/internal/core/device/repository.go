// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package device

import (
	"context"
	"errors"

	"github.com/outshift/identity-service/internal/core/device/types"
	"github.com/outshift/identity-service/internal/pkg/pagination"
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
	ListRegisteredDevices(
		ctx context.Context,
		paginationFilter pagination.PaginationFilter,
		query *string,
	) (*pagination.Pageable[types.Device], error)
	DeleteDevice(ctx context.Context, device *types.Device) error
}

var (
	ErrDeviceNotFound = errors.New("device not found")
)
