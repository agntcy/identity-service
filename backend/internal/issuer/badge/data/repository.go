// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package data

import (
	internalIssuerTypes "github.com/agntcy/identity-saas/internal/issuer/types"
)

type BadgeRepository interface {
	AddBadge(
		vaultId, keyId, issuerId, metadataId string,
		envelopedCredential *internalIssuerTypes.Badge,
	) (string, error)
	GetAllBadges(vaultId, keyId, issuerId, metadataId string) ([]*internalIssuerTypes.Badge, error)
	GetBadge(
		vaultId, keyId, issuerId, metadataId, badgeId string,
	) (*internalIssuerTypes.Badge, error)
	RemoveBadge(vaultId, keyId, issuerId, metadataId, badgeId string) error
}
