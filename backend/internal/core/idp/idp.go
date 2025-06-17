// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package idp

import (
	"context"
)

// Idp defines methods for interacting with identity providers (IdPs).
type Idp interface {
	// TestSettings checks the connection and configuration of the IdP.
	TestSettings(ctx context.Context) error

	// Creates a new client credentials pair in the IdP.
	CreateClientCredentialsPair(ctx context.Context) error
}
