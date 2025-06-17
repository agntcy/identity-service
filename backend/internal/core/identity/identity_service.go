// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package identity

import (
	"context"
	"fmt"
	"os"

	idpcore "github.com/agntcy/identity-platform/internal/core/idp"
	identitycontext "github.com/agntcy/identity-platform/internal/pkg/context"
	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/internal/tmp/joseutil"
	"github.com/agntcy/identity-platform/internal/tmp/keystore"
	"github.com/google/uuid"
)

const keyBasePath = "key"

type Service interface {
	RegisterIssuer(
		ctx context.Context,
		clientCredentials *idpcore.ClientCredentials,
		commonName *string,
	) error
}

// The verificationService struct implements the VerificationService interface
type service struct {
	vaultAddress    string
	identityAddress string
	goEnv           string
}

// NewVerificationService creates a new instance of the VerificationService
func NewService(
	vaultHost, vaultPort string,
	vaultUseSSL bool,
	identityHost, identityPort string,
	goEnv string,
) Service {
	// Get protocol
	vaultProtocol := "http:"
	if vaultUseSSL {
		vaultProtocol = "https:"
	}

	return &service{
		vaultAddress:    fmt.Sprintf("%s//%s:%s", vaultProtocol, vaultHost, vaultPort),
		identityAddress: fmt.Sprintf("http://%s:%s", identityHost, identityPort),
		goEnv:           goEnv,
	}
}

func (s *service) RegisterIssuer(
	ctx context.Context,
	clientCredentials *idpcore.ClientCredentials, commonName *string,
) error {
	// Generate a new key for the issuer
	if err := s.generateAndSaveKey(ctx); err != nil {
		return errutil.Err(
			err,
			"error generating and saving key for issuer",
		)
	}

	return nil
}

func (s *service) generateAndSaveKey(ctx context.Context) error {
	// Connect to the vault
	vaultService, err := s.connectVault(ctx)
	if err != nil {
		return err
	}

	// Generate a new key
	keyId := uuid.NewString()

	priv, err := joseutil.GenerateJWK("RS256", "sig", keyId)
	if err != nil {
		return fmt.Errorf("error generating JWK: %w", err)
	}

	err = vaultService.SaveKey(ctx, priv.KID, priv)
	if err != nil {
		return fmt.Errorf("error saving key: %w", err)
	}

	return nil
}

func (s *service) connectVault(ctx context.Context) (keystore.KeyService, error) {
	// Get the token depending on the environment
	token := ""
	if s.goEnv != "production" {
		// In dev mode, we use the root token
		token = os.Getenv("VAULT_DEV_ROOT_TOKEN")
	}

	// Get the tenant ID from the context
	tenantId, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return nil, fmt.Errorf("tenant ID not found in context")
	}

	// Create config
	config := keystore.VaultStorageConfig{
		Address:     s.vaultAddress,
		Token:       token, // This should be set in dev mode only
		MountPath:   tenantId,
		KeyBasePath: keyBasePath,
	}

	return keystore.NewKeyService(keystore.VaultStorage, config)
}
