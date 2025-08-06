// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package badge

import (
	"context"
	"fmt"
	"time"

	"github.com/agntcy/identity/pkg/jwk"
	"github.com/google/uuid"
	"github.com/outshift/identity-service/internal/core/badge/types"
	identitycore "github.com/outshift/identity-service/internal/core/identity"
	idpcore "github.com/outshift/identity-service/internal/core/idp"
)

type Revoker interface {
	RevokeAll(
		ctx context.Context,
		appID string,
		clientCredentials *idpcore.ClientCredentials,
		issuer *identitycore.Issuer,
		privKey *jwk.Jwk,
	) error
}

type revoker struct {
	badgeRepository Repository
	identityService identitycore.Service
}

func NewRevoker(
	badgeRepository Repository,
	identityService identitycore.Service,
) Revoker {
	return &revoker{
		badgeRepository: badgeRepository,
		identityService: identityService,
	}
}

func (s *revoker) RevokeAll(
	ctx context.Context,
	appID string,
	clientCredentials *idpcore.ClientCredentials,
	issuer *identitycore.Issuer,
	privKey *jwk.Jwk,
) error {
	badges, err := s.badgeRepository.GetAllActiveBadges(ctx, appID)
	if err != nil {
		return err
	}

	for _, badge := range badges {
		err := revoke(badge, privKey)
		if err != nil {
			return err
		}

		err = s.identityService.RevokeVerifiableCredential(ctx, clientCredentials, &badge.VerifiableCredential, issuer)
		if err != nil {
			return fmt.Errorf("unable to revoke badge %s: %w", badge.ID, err)
		}

		err = s.badgeRepository.Update(ctx, badge)
		if err != nil {
			return fmt.Errorf("unable to save revoked badge %s: %w", badge.ID, err)
		}
	}

	return nil
}

func revoke(badge *types.Badge, privateKey *jwk.Jwk) error {
	badge.Status = append(badge.Status, &types.CredentialStatus{
		ID: fmt.Sprintf(
			"https://spec.identity.agntcy.org/protodocs/agntcy/identity/core/v1alpha1/vc.proto#%s",
			uuid.NewString(),
		),
		Type:      "CredentialStatus",
		Purpose:   types.CREDENTIAL_STATUS_PURPOSE_REVOCATION,
		CreatedAt: time.Now().UTC(),
	})

	err := sign(&badge.VerifiableCredential, privateKey)
	if err != nil {
		return err
	}

	return nil
}
