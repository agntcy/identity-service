// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package data

import (
	"github.com/agntcy/identity-platform/internal/issuer/metadata/types"
)

type MetadataRepository interface {
	AddMetadata(
		vaultId, keyId, issuerId string, metadata *types.Metadata,
	) (string, error)
	GetAllMetadata(vaultId, keyId, issuerId string) ([]*types.Metadata, error)
	GetMetadata(vaultId, keyId, issuerId, metadataId string) (*types.Metadata, error)
	RemoveMetadata(vaultId, keyId, issuerId, metadataId string) error
}
