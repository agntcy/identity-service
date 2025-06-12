// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package data

import (
	types "github.com/agntcy/identity-platform/internal/issuer/vault/types"
)

type VaultRepository interface {
	AddVault(vault *types.Vault) (string, error)
	GetAllVaults() ([]*types.Vault, error)
	GetVault(vaultId string) (*types.Vault, error)
	RemoveVault(vaultId string) error
}
