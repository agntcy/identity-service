// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package auth

import (
	"context"
	"errors"

	types "github.com/agntcy/identity-service/internal/core/auth/types/int"
)

type Repository interface {
	CreateSession(ctx context.Context, session *types.Session) (*types.Session, error)
	GetSessionByAuthCode(ctx context.Context, code string) (*types.Session, error)
	GetSessionByAccessToken(ctx context.Context, accessToken string) (*types.Session, error)
	UpdateSession(ctx context.Context, session *types.Session) error
	CreateDeviceOTP(ctx context.Context, otp *types.SessionDeviceOTP) error
	GetDeviceOTP(ctx context.Context, id string) (*types.SessionDeviceOTP, error)
	UpdateDeviceOTP(ctx context.Context, otp *types.SessionDeviceOTP) error
	GetDeviceOTPByValue(
		ctx context.Context,
		deviceID, sessionID, value string,
	) (*types.SessionDeviceOTP, error)
}

var (
	ErrDeviceOTPNotFound = errors.New("device OTP not found")
	ErrSessionNotFound   = errors.New("session not found")
)
