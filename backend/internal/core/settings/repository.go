// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package settings

import (
	"context"

	"github.com/outshift/identity-service/internal/core/settings/types"
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
