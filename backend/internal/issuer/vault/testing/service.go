// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package vault_test

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"encoding/json"

	idtypes "github.com/agntcy/identity-platform/internal/core/id/types"
	"github.com/agntcy/identity-platform/internal/issuer/vault/types"
	"github.com/lestrrat-go/jwx/v3/jwa"
	"github.com/lestrrat-go/jwx/v3/jwk"
)

const keySize = 2048

type FakeVaultService interface {
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

type fakeVaultService struct {
}

func NewFakeVaultService() FakeVaultService {
	return &fakeVaultService{}
}

func (s *fakeVaultService) ConnectVault(
	vault *types.Vault,
) (string, error) {
	return "", nil
}

func (s *fakeVaultService) GetAllVaults() ([]*types.Vault, error) {
	return nil, nil
}

func (s *fakeVaultService) GetVault(vaultId string) (*types.Vault, error) {
	return &types.Vault{}, nil
}

func (s *fakeVaultService) ForgetVault(vaultId string) error {
	return nil
}

func (s *fakeVaultService) RetrievePubKey(
	ctx context.Context,
	vaultID string,
	keyID string,
) (*idtypes.Jwk, error) {
	return &idtypes.Jwk{}, nil
}

func (s *fakeVaultService) RetrievePrivKey(
	ctx context.Context,
	vaultID string,
	keyID string,
) (*idtypes.Jwk, error) {
	return generatePrivKey()
}

func generatePrivKey() (*idtypes.Jwk, error) {
	pk, err := rsa.GenerateKey(rand.Reader, keySize)
	if err != nil {
		return nil, err
	}

	key, err := jwk.Import(pk)
	if err != nil {
		return nil, err
	}

	err = key.Set(jwk.AlgorithmKey, jwa.RS256())
	if err != nil {
		return nil, err
	}

	keyAsJson, err := json.Marshal(key)
	if err != nil {
		return nil, err
	}

	var k idtypes.Jwk

	err = json.Unmarshal(keyAsJson, &k)
	if err != nil {
		return nil, err
	}

	return &k, nil
}
