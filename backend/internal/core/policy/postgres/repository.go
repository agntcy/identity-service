// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package postgres

import (
	"context"
	"errors"

	policycore "github.com/agntcy/identity-platform/internal/core/policy"
	"github.com/agntcy/identity-platform/internal/core/policy/types"
	identitycontext "github.com/agntcy/identity-platform/internal/pkg/context"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/pkg/db"
)

type repository struct {
	dbContext db.Context
}

func NewRepository(dbContext db.Context) policycore.Repository {
	return &repository{
		dbContext: dbContext,
	}
}

func (r *repository) Create(ctx context.Context, policy *types.Policy) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return errors.New("failed to get tenant ID from context")
	}

	model := newPolicyModel(policy, tenantID)

	result := r.dbContext.Client().Create(model)
	if result.Error != nil {
		return errutil.Err(
			result.Error, "there was an error creating the policy",
		)
	}

	return nil
}
