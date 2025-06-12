// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package types

import (
	vctypes "github.com/agntcy/identity-platform/internal/core/vc/types"
)

type Badge struct {
	// The badge ID
	Id string `json:"id,omitempty"`

	// The verifiable credential
	EnvelopedCredential *vctypes.EnvelopedCredential `json:"badge,omitempty"`
}
