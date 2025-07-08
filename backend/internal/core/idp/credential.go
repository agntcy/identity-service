// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Settingsentifier: Apache-2.0

package idp

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	identitycontext "github.com/agntcy/identity-platform/internal/pkg/context"
	"github.com/agntcy/identity-platform/internal/pkg/vault"
)

const (
	mountPath = "credentials"
)

var ErrCredentialNotFound = errors.New("credential not found")

type CredentialStore interface {
	Get(
		ctx context.Context,
		subject string,
	) (*ClientCredentials, error)
	Put(
		ctx context.Context,
		cred *ClientCredentials,
		subject string,
	) error
	Delete(
		ctx context.Context,
		subject string,
	) error
}

type VaultCredentialStore struct {
	vaultClient vault.VaultClient
}

func NewCredentialStore(vaultClient vault.VaultClient) CredentialStore {
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

	data, err := s.vaultClient.Get(ctx, s.getSecretPath(tenantID, subject))
	if err != nil {
		return nil, fmt.Errorf("unable to get client credentials from vault: %w", err)
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

	raw, err := json.Marshal(cred)
	if err != nil {
		return fmt.Errorf("unable to marshal credentials: %w", err)
	}

	var data map[string]any

	err = json.Unmarshal(raw, &data)
	if err != nil {
		return fmt.Errorf("unable to unmarshal credentials: %w", err)
	}

	err = s.vaultClient.Put(ctx, s.getSecretPath(tenantID, subject), data)
	if err != nil {
		return fmt.Errorf("unable to store client credentials: %w", err)
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

	err := s.vaultClient.Delete(ctx, s.getSecretPath(tenantID, subject))
	if err != nil {
		return fmt.Errorf("unable to delete client credentials: %w", err)
	}

	return nil
}

func (*VaultCredentialStore) getSecretPath(tenantID, subject string) string {
	return fmt.Sprintf("%s/%s/%s", mountPath, tenantID, subject)
}
