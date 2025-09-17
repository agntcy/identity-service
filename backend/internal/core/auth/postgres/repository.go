// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Settingsentifier: Apache-2.0

package postgres

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	sessioncore "github.com/outshift/identity-service/internal/core/auth"
	types "github.com/outshift/identity-service/internal/core/auth/types/int"
	identitycontext "github.com/outshift/identity-service/internal/pkg/context"
	"github.com/outshift/identity-service/internal/pkg/secrets"
	"gorm.io/gorm"
)

type postgresRepository struct {
	dbContext *gorm.DB
	crypter   secrets.Crypter
}

func NewRepository(dbContext *gorm.DB, crypter secrets.Crypter) sessioncore.Repository {
	return &postgresRepository{
		dbContext: dbContext,
		crypter:   crypter,
	}
}

func (r *postgresRepository) Create(
	ctx context.Context,
	session *types.Session,
) (*types.Session, error) {
	model := newSessionModel(session, r.crypter)

	result := r.dbContext.Create(model)
	if result.Error != nil {
		return nil, fmt.Errorf("there was an error creating the session: %w", result.Error)
	}

	return model.ToCoreType(r.crypter), nil
}

func (r *postgresRepository) GetByAuthorizationCode(
	ctx context.Context,
	code string,
) (*types.Session, error) {
	model := &Session{}

	// Get app id from context
	appID, ok := identitycontext.GetAppID(ctx)
	if !ok || appID == "" {
		return nil, identitycontext.ErrAppNotFound
	}

	result := r.dbContext.
		Where("owner_app_id = ?", appID).
		Where("authorization_code = ?", code).
		Where("access_token IS NULL").
		Where("expires_at > ?", time.Now().Unix()).
		First(model)
	if result.Error != nil {
		return nil, fmt.Errorf("there was an error retrieving the session by code: %w", result.Error)
	}

	return model.ToCoreType(r.crypter), nil
}

func (r *postgresRepository) GetByAccessToken(
	ctx context.Context,
	accessToken string,
) (*types.Session, error) {
	model := &Session{}

	// Get app id from context
	appID, ok := identitycontext.GetAppID(ctx)
	if !ok || appID == "" {
		return nil, identitycontext.ErrAppNotFound
	}

	result := r.dbContext.
		Where("(app_id = ? OR app_id IS NULL)", appID).
		Where("access_token = ?", r.crypter.Encrypt(accessToken)).
		First(model)
	if result.Error != nil {
		return nil, fmt.Errorf("there was an error retrieving the session by token ID: %w", result.Error)
	}

	return model.ToCoreType(r.crypter), nil
}

func (r *postgresRepository) Update(ctx context.Context, session *types.Session) error {
	model := newSessionModel(session, r.crypter)
	model.ID = uuid.MustParse(session.ID)

	result := r.dbContext.Save(model)
	if result.Error != nil {
		return fmt.Errorf("there was an error updating the session: %w", result.Error)
	}

	return nil
}

func (r *postgresRepository) CreateDeviceOTP(
	ctx context.Context,
	otp *types.SessionDeviceOTP,
) error {
	model := newSessionDeviceOTPModel(otp)

	result := r.dbContext.Create(model)
	if result.Error != nil {
		return fmt.Errorf("there was an error creating the device OTP: %w", result.Error)
	}

	return nil
}

func (r *postgresRepository) GetDeviceOTP(
	ctx context.Context,
	id string,
) (*types.SessionDeviceOTP, error) {
	var otp SessionDeviceOTP

	result := r.dbContext.First(&otp, uuid.MustParse(id))
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, sessioncore.ErrDeviceOTPNotFound
		}

		return nil, fmt.Errorf("there was an error fetching the OTP: %w", result.Error)
	}

	return otp.ToCoreType(), nil
}

func (r *postgresRepository) UpdateDeviceOTP(
	ctx context.Context,
	otp *types.SessionDeviceOTP,
) error {
	model := newSessionDeviceOTPModel(otp)

	err := r.dbContext.Save(model).Error
	if err != nil {
		return fmt.Errorf("there was an error updating the device OTP: %w", err)
	}

	return nil
}

func (r *postgresRepository) GetDeviceOTPByValue(
	ctx context.Context,
	deviceID string,
	sessionID string,
	value string,
) (*types.SessionDeviceOTP, error) {
	var otp SessionDeviceOTP

	result := r.dbContext.
		Where(
			"value = ? AND device_id = ? AND session_id = ?",
			value,
			deviceID,
			sessionID,
		).
		First(&otp)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, sessioncore.ErrDeviceOTPNotFound
		}

		return nil, fmt.Errorf("there was an error fetching the OTP by value: %w", result.Error)
	}

	return otp.ToCoreType(), nil
}
