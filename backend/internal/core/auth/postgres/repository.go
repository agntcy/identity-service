// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Settingsentifier: Apache-2.0

package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	sessioncore "github.com/outshift/identity-service/internal/core/auth"
	"github.com/outshift/identity-service/internal/core/auth/types"
	identitycontext "github.com/outshift/identity-service/internal/pkg/context"
	"github.com/outshift/identity-service/internal/pkg/errutil"
	"github.com/outshift/identity-service/internal/pkg/ptrutil"
	"github.com/outshift/identity-service/internal/pkg/secrets"
	"github.com/outshift/identity-service/internal/pkg/strutil"
	"github.com/outshift/identity-service/pkg/db"
	"gorm.io/gorm"
)

const (
	// Default length for authorization codes
	codeLength = 128

	// Default session duration for authorization codes and consumption
	sessionDuration = 5 * time.Minute
)

type postgresRepository struct {
	dbContext db.Context
}

func NewRepository(dbContext db.Context) sessioncore.Repository {
	return &postgresRepository{
		dbContext: dbContext,
	}
}

func (r *postgresRepository) Create(
	ctx context.Context,
	session *types.Session,
) (*types.Session, error) {
	model := newSessionModel(session)

	// Generate a new auth code
	model.AuthorizationCode = ptrutil.Ptr(strutil.Random(codeLength))

	// Add expiration time
	model.ExpiresAt = ptrutil.Ptr(time.Now().Add(sessionDuration).Unix())

	result := r.dbContext.Client().Create(model)
	if result.Error != nil {
		return nil, errutil.Err(
			result.Error, "there was an error creating the session",
		)
	}

	return model.ToCoreType(), nil
}

func (r *postgresRepository) GetByAuthorizationCode(
	ctx context.Context,
	code string,
) (*types.Session, error) {
	model := &Session{}

	// Get app id from context
	appID, ok := identitycontext.GetAppID(ctx)
	if !ok || appID == "" {
		return nil, errutil.Err(
			nil,
			"app ID not found in context",
		)
	}

	result := r.dbContext.Client().
		Where("owner_app_id = ?", appID).
		Where("authorization_code = ?", code).
		Where("access_token IS NULL").
		Where("expires_at > ?", time.Now().Unix()).
		First(model)
	if result.Error != nil {
		return nil, errutil.Err(
			result.Error, "there was an error retrieving the session by code",
		)
	}

	return model.ToCoreType(), nil
}

func (r *postgresRepository) GetByAccessToken(
	ctx context.Context,
	accessToken string,
) (*types.Session, error) {
	model := &Session{}

	// Get app id from context
	appID, ok := identitycontext.GetAppID(ctx)
	if !ok || appID == "" {
		return nil, errutil.Err(
			nil,
			"app ID not found in context",
		)
	}

	result := r.dbContext.Client().
		Where("(app_id = ? OR app_id IS NULL)", appID).
		Where("access_token = ?", secrets.Encrypt(accessToken)).
		First(model)
	if result.Error != nil {
		return nil, errutil.Err(
			result.Error, "there was an error retrieving the session by token ID",
		)
	}

	return model.ToCoreType(), nil
}

func (r *postgresRepository) Update(ctx context.Context, session *types.Session) error {
	model := newSessionModel(session)
	model.ID = uuid.MustParse(session.ID)

	result := r.dbContext.Client().Save(model)
	if result.Error != nil {
		return errutil.Err(
			result.Error, "there was an error updating the session",
		)
	}

	return nil
}

func (r *postgresRepository) CreateDeviceOTP(ctx context.Context, otp *types.SessionDeviceOTP) error {
	model := newSessionDeviceOTPModel(otp)

	result := r.dbContext.Client().Create(model)
	if result.Error != nil {
		return errutil.Err(
			result.Error, "there was an error creating the device OTP",
		)
	}

	return nil
}

func (r *postgresRepository) GetDeviceOTP(
	ctx context.Context,
	id string,
) (*types.SessionDeviceOTP, error) {
	var otp SessionDeviceOTP

	result := r.dbContext.Client().First(&otp, uuid.MustParse(id))
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errutil.Err(result.Error, "OTP not found")
		}

		return nil, errutil.Err(result.Error, "there was an error fetching the OTP")
	}

	return otp.ToCoreType(), nil
}

func (r *postgresRepository) UpdateDeviceOTP(
	ctx context.Context,
	otp *types.SessionDeviceOTP,
) error {
	model := newSessionDeviceOTPModel(otp)

	err := r.dbContext.Client().Save(model).Error
	if err != nil {
		return errutil.Err(err, "there was an error updating the device OTP")
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

	result := r.dbContext.Client().
		Where(
			"value = ? AND device_id = ? AND session_id = ?",
			value,
			deviceID,
			sessionID,
		).
		First(&otp)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errutil.Err(result.Error, "OTP not found")
		}

		return nil, errutil.Err(result.Error, "there was an error fetching the OTP")
	}

	return otp.ToCoreType(), nil
}
