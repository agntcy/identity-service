// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Settingsentifier: Apache-2.0

package identity

import (
	"context"
	"fmt"
	"net"
	"path"

	identitycontext "github.com/outshift/identity-service/internal/pkg/context"
	"github.com/agntcy/identity/pkg/joseutil"
	"github.com/agntcy/identity/pkg/jwk"
	"github.com/agntcy/identity/pkg/keystore"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/google/uuid"
)

const (
	keysMountPath = "key-"
)

type KeyStore interface {
	GenerateAndSaveKey(ctx context.Context) (*jwk.Jwk, error)
	RetrievePubKey(ctx context.Context, id string) (*jwk.Jwk, error)
	RetrievePrivKey(ctx context.Context, id string) (*jwk.Jwk, error)
}

type VaultKeyStore struct {
	store keystore.KeyService
}

func NewVaultKeyStore(
	vaultHost, vaultPort string,
	vaultUseSSL bool,
	token string,
) (KeyStore, error) {
	vaultProtocol := "http:"
	if vaultUseSSL {
		vaultProtocol = "https:"
	}

	config := keystore.VaultStorageConfig{
		Address:     fmt.Sprintf("%s//%s", vaultProtocol, net.JoinHostPort(vaultHost, vaultPort)),
		Token:       token, // This should be set in dev mode only
		MountPath:   "secret",
		KeyBasePath: keysMountPath,
	}

	store, err := keystore.NewKeyService(keystore.VaultStorage, config)
	if err != nil {
		return nil, err
	}

	return &VaultKeyStore{
		store: store,
	}, nil
}

func NewAwsSmKeyStore(awsCfg *aws.Config, kmsKeyID *string) (KeyStore, error) {
	config := keystore.AwsSmStorageConfig{
		AwsCfg:      awsCfg,
		MountPath:   "pyramid",
		KeyBasePath: "keys",
		KmsKeyID:    kmsKeyID,
	}

	store, err := keystore.NewKeyService(keystore.AwsSmStorage, config)
	if err != nil {
		return nil, err
	}

	return &VaultKeyStore{
		store: store,
	}, nil
}

func (s *VaultKeyStore) GenerateAndSaveKey(ctx context.Context) (*jwk.Jwk, error) {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return nil, identitycontext.ErrTenantNotFound
	}

	// Generate a new key
	keyId := uuid.NewString()

	priv, err := joseutil.GenerateJWK("RS256", "sig", keyId)
	if err != nil {
		return nil, fmt.Errorf("error generating JWK: %w", err)
	}

	err = s.store.SaveKey(ctx, s.buildFullPath(tenantID, priv.KID), priv)
	if err != nil {
		return nil, fmt.Errorf("error saving key: %w", err)
	}

	return priv, nil
}

func (s *VaultKeyStore) RetrievePubKey(ctx context.Context, id string) (*jwk.Jwk, error) {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return nil, identitycontext.ErrTenantNotFound
	}

	return s.store.RetrievePubKey(ctx, s.buildFullPath(tenantID, id))
}

func (s *VaultKeyStore) RetrievePrivKey(ctx context.Context, id string) (*jwk.Jwk, error) {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return nil, identitycontext.ErrTenantNotFound
	}

	return s.store.RetrievePrivKey(ctx, s.buildFullPath(tenantID, id))
}

func (s *VaultKeyStore) buildFullPath(tenantID, kID string) string {
	return path.Join(tenantID, kID)
}
