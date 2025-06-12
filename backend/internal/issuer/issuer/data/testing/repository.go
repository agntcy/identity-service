// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package testing

import (
	"github.com/agntcy/identity-platform/internal/issuer/issuer/data"
	"github.com/agntcy/identity-platform/internal/issuer/issuer/types"
)

type FakeIssuerRepository struct {
}

func NewFakeIssuerRepository() data.IssuerRepository {
	return &FakeIssuerRepository{}
}

func (i *FakeIssuerRepository) AddIssuer(
	vaultId, keyId string,
	issuer *types.Issuer,
) (string, error) {
	return "", nil
}

func (i *FakeIssuerRepository) GetAllIssuers(vaultId, keyId string) ([]*types.Issuer, error) {
	return []*types.Issuer{
		{},
	}, nil
}

func (i *FakeIssuerRepository) GetIssuer(vaultId, keyId, issuerId string) (*types.Issuer, error) {
	return &types.Issuer{}, nil
}

func (i *FakeIssuerRepository) RemoveIssuer(vaultId, keyId, issuerId string) error {
	return nil
}
