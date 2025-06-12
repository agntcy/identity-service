// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package types

import (
	issuertypes "github.com/agntcy/identity-platform/internal/core/issuer/types"
	idptypes "github.com/agntcy/identity-platform/internal/issuer/types"
)

type Issuer struct {
	issuertypes.Issuer

	// The issuer ID
	ID string `json:"id,omitempty"`

	// The identity node URL
	IdentityNodeURL string `json:"identity_node_url,omitempty"`

	// The identity provider configuration
	IdpConfig *idptypes.IdpConfig `json:"idp_config,omitempty"`
}
