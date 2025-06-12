// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package data

import (
	"github.com/agntcy/identity-saas/internal/issuer/issuer/types"
)

type IssuerRepository interface {
	AddIssuer(vaultId, keyId string, issuer *types.Issuer) (string, error)
	GetAllIssuers(vaultId, keyId string) ([]*types.Issuer, error)
	GetIssuer(vaultId, keyId, issuerId string) (*types.Issuer, error)
	RemoveIssuer(vaultId, keyId, issuerId string) error
}
