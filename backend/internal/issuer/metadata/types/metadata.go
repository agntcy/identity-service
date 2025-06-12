// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package types

import (
	idtypes "github.com/agntcy/identity-platform/internal/core/id/types"
	idptypes "github.com/agntcy/identity-platform/internal/issuer/types"
)

type Metadata struct {
	idtypes.ResolverMetadata

	// The identity provider configuration
	IdpConfig *idptypes.IdpConfig `json:"idp_config,omitempty"`
}
