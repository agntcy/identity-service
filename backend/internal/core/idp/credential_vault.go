// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package idp

import (
	"context"
	"encoding/json"
	"fmt"

	identitycontext "github.com/agntcy/identity-service/internal/pkg/context"
	"github.com/agntcy/identity-service/internal/pkg/vault"
)

type VaultCredentialStore struct {
	vaultClient vault.VaultClient
}

func NewVaultCredentialStore(vaultClient vault.VaultClient) CredentialStore {
	return &VaultCredentialStore{
		vaultClient: vaultClient,
	}
}

func (s *VaultCredentialStore) Get(
	ctx context.Context,
	subject string,
) (*ClientCredentials, error) {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return nil, identitycontext.ErrTenantNotFound
	}

	path := s.getSecretPath(tenantID, subject)

	data, err := s.vaultClient.Get(ctx, path)
	if err != nil {
		return nil, fmt.Errorf("vault client failed to get client credentials (%s): %w", path, err)
	}

	if data == nil {
		return nil, ErrCredentialNotFound
	}

	raw, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("unable to marshal raw client credentials: %w", err)
	}

	var cred ClientCredentials

	err = json.Unmarshal(raw, &cred)
	if err != nil {
		return nil, fmt.Errorf("unable to unmarshal credentials: %w", err)
	}

	return &cred, nil
}

func (s *VaultCredentialStore) Put(
	ctx context.Context,
	cred *ClientCredentials,
	subject string,
) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return identitycontext.ErrTenantNotFound
	}

	if cred == nil {
		return fmt.Errorf("cannot store null credentials")
	}

	raw, err := json.Marshal(cred)
	if err != nil {
		return fmt.Errorf("unable to marshal credentials: %w", err)
	}

	var data map[string]any

	err = json.Unmarshal(raw, &data)
	if err != nil {
		return fmt.Errorf("unable to unmarshal credentials: %w", err)
	}

	path := s.getSecretPath(tenantID, subject)

	err = s.vaultClient.Put(ctx, path, data)
	if err != nil {
		return fmt.Errorf("vault client failed to store client credentials (%s): %w", path, err)
	}

	return nil
}

func (s *VaultCredentialStore) Delete(
	ctx context.Context,
	subject string,
) error {
	tenantID, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return identitycontext.ErrTenantNotFound
	}

	path := s.getSecretPath(tenantID, subject)

	err := s.vaultClient.Delete(ctx, path)
	if err != nil {
		return fmt.Errorf("vault client failed to delete client credentials (%s): %w", path, err)
	}

	return nil
}

func (*VaultCredentialStore) getSecretPath(tenantID, subject string) string {
	return fmt.Sprintf("%s/%s/%s", mountPath, tenantID, subject)
}
