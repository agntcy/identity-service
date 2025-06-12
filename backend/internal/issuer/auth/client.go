// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package auth

import (
	"context"
	"fmt"
	"strings"

	"github.com/agntcy/identity-platform/internal/issuer/issuer/types"
	idptypes "github.com/agntcy/identity-platform/internal/issuer/types"
	"github.com/agntcy/identity-platform/internal/issuer/vault"
	"github.com/agntcy/identity-platform/internal/node"
	"github.com/agntcy/identity-platform/internal/pkg/jwtutil"
	"github.com/agntcy/identity-platform/internal/pkg/oidc"
	"github.com/google/uuid"
)

type Client interface {
	// Token generates a JWT token for the issuer.
	// If idpConfig is nil, it uses the issuer's private key to generate the JWT.
	// If id is provided, it will be used as the subject of the JWT.
	// Otherwise, one will be generated.
	Token(
		ctx context.Context,
		vaultId, keyId string,
		issuer *types.Issuer,
		idpConfig *idptypes.IdpConfig,
		id *string,
	) (string, error)
}

type client struct {
	auth     oidc.Authenticator
	vaultSrv vault.VaultService
}

func NewClient(
	auth oidc.Authenticator,
	vaultSrv vault.VaultService,
) Client {
	return &client{
		auth:     auth,
		vaultSrv: vaultSrv,
	}
}

func (s *client) Token(
	ctx context.Context,
	vaultId, keyId string,
	issuer *types.Issuer,
	idpConfig *idptypes.IdpConfig,
	id *string,
) (string, error) {
	var auth string
	var err error

	if idpConfig == nil {
		prvKey, keyErr := s.vaultSrv.RetrievePrivKey(
			ctx,
			vaultId,
			keyId,
		)
		if keyErr != nil {
			return "", fmt.Errorf("error retrieving public key: %w", err)
		}

		// If id is nil, we generate a new UUID for the subject.
		var sub string
		if id == nil {
			sub = uuid.NewString()
		} else {
			// Remove self scheme prefix if it exists.
			sub = strings.TrimPrefix(*id, node.SelfScheme)
		}

		// If no IdpConfig is provided, we generate a JWT auth using the issuer's private key.
		auth, err = jwtutil.Jwt(
			issuer.CommonName,
			sub,
			prvKey,
		)
	} else {
		auth, err = s.auth.Token(
			ctx,
			idpConfig.IssuerUrl,
			idpConfig.ClientId,
			idpConfig.ClientSecret,
		)
	}

	return auth, err
}
