// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package idp_test

import (
	"context"
	"errors"
	"fmt"
	"testing"

	"github.com/google/uuid"
	"github.com/outshift/identity-service/internal/core/idp"
	identitycontext "github.com/outshift/identity-service/internal/pkg/context"
	vaultmocks "github.com/outshift/identity-service/internal/pkg/vault/mocks"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestVaultCredentialStore_Get(t *testing.T) {
	t.Parallel()

	tenantID := uuid.NewString()
	subject := uuid.NewString()
	secretPath := getSecretPath(t, tenantID, subject)
	ctx := identitycontext.InsertTenantID(context.Background(), tenantID)

	t.Run("should return valid credentials from the vault", func(t *testing.T) {
		t.Parallel()

		clientID := uuid.NewString()
		clientSecret := uuid.NewString()
		issuer := uuid.NewString()

		vaultClient := vaultmocks.NewVaultClient(t)
		vaultClient.EXPECT().Get(ctx, secretPath).Return(map[string]any{
			"client_id":     clientID,
			"client_secret": clientSecret,
			"issuer":        issuer,
		}, nil)

		sut := idp.NewVaultCredentialStore(vaultClient)

		actualCreds, err := sut.Get(ctx, subject)

		assert.NoError(t, err)
		assert.Equal(t, clientID, actualCreds.ClientID)
		assert.Equal(t, clientSecret, actualCreds.ClientSecret)
		assert.Equal(t, issuer, actualCreds.Issuer)
	})

	t.Run("should return an error if tenantID not found in context", func(t *testing.T) {
		t.Parallel()

		invalidCtx := context.Background()

		sut := idp.NewVaultCredentialStore(nil)

		_, err := sut.Get(invalidCtx, "")

		assert.ErrorIs(t, err, identitycontext.ErrTenantNotFound)
	})

	t.Run("should return an error if vault client returns an error", func(t *testing.T) {
		t.Parallel()

		vaultClient := vaultmocks.NewVaultClient(t)
		vaultClient.EXPECT().Get(ctx, secretPath).Return(nil, errors.New("failed"))

		sut := idp.NewVaultCredentialStore(vaultClient)

		_, err := sut.Get(ctx, subject)

		assert.Error(t, err)
		assert.ErrorContains(t, err, "unable to get client credentials from vault")
	})

	t.Run("should return an error if secret path not found in valut", func(t *testing.T) {
		t.Parallel()

		vaultClient := vaultmocks.NewVaultClient(t)
		vaultClient.EXPECT().Get(ctx, secretPath).Return(nil, nil)

		sut := idp.NewVaultCredentialStore(vaultClient)

		_, err := sut.Get(ctx, subject)

		assert.ErrorIs(t, err, idp.ErrCredentialNotFound)
	})
}

func TestVaultCredentialStore_Put(t *testing.T) {
	t.Parallel()

	tenantID := uuid.NewString()
	subject := uuid.NewString()
	secretPath := getSecretPath(t, tenantID, subject)
	ctx := identitycontext.InsertTenantID(context.Background(), tenantID)

	t.Run("should store credentials in the vault", func(t *testing.T) {
		t.Parallel()

		creds := &idp.ClientCredentials{
			ClientID:     uuid.NewString(),
			ClientSecret: uuid.NewString(),
			Issuer:       uuid.NewString(),
		}

		vaultClient := vaultmocks.NewVaultClient(t)
		vaultClient.EXPECT().Put(ctx, secretPath, map[string]any{
			"client_id":     creds.ClientID,
			"client_secret": creds.ClientSecret,
			"issuer":        creds.Issuer,
		}).Return(nil)

		sut := idp.NewVaultCredentialStore(vaultClient)

		err := sut.Put(ctx, creds, subject)

		assert.NoError(t, err)
	})

	t.Run("should return an error if tenantID not found in context", func(t *testing.T) {
		t.Parallel()

		invalidCtx := context.Background()

		sut := idp.NewVaultCredentialStore(nil)

		err := sut.Put(invalidCtx, nil, "")

		assert.ErrorIs(t, err, identitycontext.ErrTenantNotFound)
	})

	t.Run("should return an error if vault fails to store", func(t *testing.T) {
		t.Parallel()

		vaultClient := vaultmocks.NewVaultClient(t)
		vaultClient.EXPECT().Put(ctx, secretPath, mock.Anything).Return(errors.New("failed"))

		sut := idp.NewVaultCredentialStore(vaultClient)

		err := sut.Put(ctx, &idp.ClientCredentials{}, subject)

		assert.Error(t, err)
		assert.ErrorContains(t, err, "unable to store client credentials")
	})

	t.Run("should return an error if cred parameter is nil", func(t *testing.T) {
		t.Parallel()

		sut := idp.NewVaultCredentialStore(nil)

		err := sut.Put(ctx, nil, subject)

		assert.Error(t, err)
		assert.ErrorContains(t, err, "cannot store null credentials")
	})
}

func TestVaultCredentialStore_Delete(t *testing.T) {
	t.Parallel()

	tenantID := uuid.NewString()
	subject := uuid.NewString()
	secretPath := getSecretPath(t, tenantID, subject)
	ctx := identitycontext.InsertTenantID(context.Background(), tenantID)

	t.Run("should delete creds from vault", func(t *testing.T) {
		t.Parallel()

		vaultClient := vaultmocks.NewVaultClient(t)
		vaultClient.EXPECT().Delete(ctx, secretPath).Return(nil)

		sut := idp.NewVaultCredentialStore(vaultClient)

		err := sut.Delete(ctx, subject)

		assert.NoError(t, err)
	})

	t.Run("should return an error if tenantID not found in context", func(t *testing.T) {
		t.Parallel()

		invalidCtx := context.Background()

		sut := idp.NewVaultCredentialStore(nil)

		err := sut.Delete(invalidCtx, "")

		assert.ErrorIs(t, err, identitycontext.ErrTenantNotFound)
	})

	t.Run("should return an error if vault client fails to delete", func(t *testing.T) {
		t.Parallel()

		vaultClient := vaultmocks.NewVaultClient(t)
		vaultClient.EXPECT().Delete(ctx, secretPath).Return(errors.New("failed"))

		sut := idp.NewVaultCredentialStore(vaultClient)

		err := sut.Delete(ctx, subject)

		assert.Error(t, err)
		assert.ErrorContains(t, err, "unable to delete client credentials")
	})
}

func getSecretPath(t *testing.T, tenantID, subject string) string {
	t.Helper()

	return fmt.Sprintf("credentials/%s/%s", tenantID, subject)
}
