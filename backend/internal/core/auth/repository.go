// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Settingsentifier: Apache-2.0

package auth

import (
	"context"

	"github.com/agntcy/identity-platform/internal/core/auth/types"
)

type Repository interface {
	Create(ctx context.Context, session *types.Session) (*types.Session, error)
	GetByAuthorizationCode(ctx context.Context, code string) (*types.Session, error)
	GetByAccessToken(ctx context.Context, accessToken string) (*types.Session, error)
	Update(ctx context.Context, session *types.Session) error
	CreateDeviceOTP(ctx context.Context, otp *types.SessionDeviceOTP) error
	GetDeviceOTP(ctx context.Context, id string) (*types.SessionDeviceOTP, error)
	UpdateDeviceOTP(ctx context.Context, otp *types.SessionDeviceOTP) error
	GetDeviceOTPByValue(ctx context.Context, deviceID, sessionID, value string) (*types.SessionDeviceOTP, error)
}
