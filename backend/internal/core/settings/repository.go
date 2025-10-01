// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package settings

import (
	"context"

	"github.com/agntcy/identity-service/internal/core/settings/types"
)

type Repository interface {
	UpdateIssuerSettings(
		ctx context.Context,
		issuerSettings *types.IssuerSettings,
	) (*types.IssuerSettings, error)
	GetIssuerSettings(
		ctx context.Context,
	) (*types.IssuerSettings, error)
}
