// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Settingsentifier: Apache-2.0

package auth

import (
	"context"

	"github.com/agntcy/identity-platform/internal/core/auth/types"
)

type Repository interface {
	Create(ctx context.Context, session *types.Session) (*types.Session, error)
	GetByCode(ctx context.Context, code string) (*types.Session, error)
	GetByTokenID(ctx context.Context, tokenID string) (*types.Session, error)
	Update(ctx context.Context, session *types.Session) error
}
