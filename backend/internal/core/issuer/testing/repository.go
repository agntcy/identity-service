// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package testing

import (
	"context"

	"github.com/agntcy/identity-saas/internal/core/errors"
	issuercore "github.com/agntcy/identity-saas/internal/core/issuer"
	issuertypes "github.com/agntcy/identity-saas/internal/core/issuer/types"
)

type FakeIssuerRepository struct {
	store map[string]*issuertypes.Issuer
}

func NewFakeIssuerRepository() issuercore.Repository {
	return &FakeIssuerRepository{
		store: make(map[string]*issuertypes.Issuer),
	}
}

func (r *FakeIssuerRepository) CreateIssuer(
	ctx context.Context,
	issuer *issuertypes.Issuer,
) (*issuertypes.Issuer, error) {
	r.store[issuer.CommonName] = issuer
	return issuer, nil
}

func (r *FakeIssuerRepository) GetIssuer(
	ctx context.Context,
	commonName string,
) (*issuertypes.Issuer, error) {
	if issuer, ok := r.store[commonName]; ok {
		return issuer, nil
	}

	return nil, errors.ErrResourceNotFound
}
