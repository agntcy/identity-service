// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Settingsentifier: Apache-2.0

package postgres

import (
	"context"
	"time"

	sessioncore "github.com/agntcy/identity-platform/internal/core/auth"
	"github.com/agntcy/identity-platform/internal/core/auth/types"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/internal/pkg/ptrutil"
	"github.com/agntcy/identity-platform/internal/pkg/strutil"
	"github.com/agntcy/identity-platform/pkg/db"
	"github.com/google/uuid"
)

const (
	codeLength      = 128
	sessionDuration = 5 * time.Minute // Default session duration for authorization codes
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

	// Generate and id and a new auth code
	model.ID = uuid.NewString()
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

	result := r.dbContext.Client().
		Where("authorization_code = ?", code).
		Where("expires_at < ?", time.Now().Unix()).
		First(model)
	if result.Error != nil {
		return nil, errutil.Err(
			result.Error, "there was an error retrieving the session by code",
		)
	}

	return model.ToCoreType(), nil
}

func (r *postgresRepository) GetByTokenID(
	ctx context.Context,
	tokenID string,
) (*types.Session, error) {
	model := &Session{}

	result := r.dbContext.Client().
		Where("token_id = ?", tokenID).
		Where("expires_at < ?", time.Now().Unix()).
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

	result := r.dbContext.Client().Save(model)
	if result.Error != nil {
		return errutil.Err(
			result.Error, "there was an error updating the session",
		)
	}

	return nil
}
