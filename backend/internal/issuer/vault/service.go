// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package vault

import (
	"context"
	"errors"

	idtypes "github.com/agntcy/identity-saas/internal/core/id/types"
	"github.com/agntcy/identity-saas/internal/core/keystore"
	"github.com/agntcy/identity-saas/internal/issuer/vault/data"
	"github.com/agntcy/identity-saas/internal/issuer/vault/types"
)

type VaultService interface {
	ConnectVault(vault *types.Vault) (string, error)
	GetAllVaults() ([]*types.Vault, error)
	GetVault(vaultId string) (*types.Vault, error)
	ForgetVault(vaultId string) error
	RetrievePubKey(
		ctx context.Context,
		vaultID string,
		keyID string,
	) (*idtypes.Jwk, error)
	RetrievePrivKey(
		ctx context.Context,
		vaultID string,
		keyID string,
	) (*idtypes.Jwk, error)
}

type vaultService struct {
	vaultRepository data.VaultRepository
}

func NewVaultService(
	vaultRepository data.VaultRepository,
) VaultService {
	return &vaultService{
		vaultRepository: vaultRepository,
	}
}

func (s *vaultService) ConnectVault(
	vault *types.Vault,
) (string, error) {
	vaultId, err := s.vaultRepository.AddVault(vault)
	if err != nil {
		return "", err
	}

	return vaultId, nil
}

func (s *vaultService) GetAllVaults() ([]*types.Vault, error) {
	vaults, err := s.vaultRepository.GetAllVaults()
	if err != nil {
		return nil, err
	}

	return vaults, nil
}

func (s *vaultService) GetVault(vaultId string) (*types.Vault, error) {
	vault, err := s.vaultRepository.GetVault(vaultId)
	if err != nil {
		return nil, err
	}

	return vault, nil
}

func (s *vaultService) ForgetVault(vaultId string) error {
	err := s.vaultRepository.RemoveVault(vaultId)
	if err != nil {
		return err
	}

	return nil
}

func (s *vaultService) RetrievePubKey(
	ctx context.Context,
	vaultID string,
	keyID string,
) (*idtypes.Jwk, error) {
	keySrv, err := s.newKeyService(vaultID)
	if err != nil {
		return nil, err
	}

	key, err := keySrv.RetrievePubKey(ctx, keyID)
	if err != nil {
		return nil, err
	}

	return key, nil
}

func (s *vaultService) RetrievePrivKey(
	ctx context.Context,
	vaultID string,
	keyID string,
) (*idtypes.Jwk, error) {
	keySrv, err := s.newKeyService(vaultID)
	if err != nil {
		return nil, err
	}

	key, err := keySrv.RetrievePrivKey(ctx, keyID)
	if err != nil {
		return nil, err
	}

	return key, nil
}

func (s *vaultService) newKeyService(vaultID string) (keystore.KeyService, error) {
	vault, err := s.vaultRepository.GetVault(vaultID)
	if err != nil {
		return nil, err
	}

	switch vault.Type {
	case types.VaultTypeFile:
		fv, ok := vault.Config.(*types.VaultFile)
		if !ok {
			return nil, errors.New("invalid file vault config")
		}

		keySrv, err := keystore.NewKeyService(keystore.FileStorage, keystore.FileStorageConfig{
			FilePath: fv.FilePath,
		})
		if err != nil {
			return nil, err
		}

		return keySrv, nil
	default:
		return nil, errors.New("unsupported vault type")
	}
}
