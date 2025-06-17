// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package idp

import (
	"context"
	"fmt"

	identitycontext "github.com/agntcy/identity-platform/internal/pkg/context"
)

const (
	integrationPrefix = "identity-"
	customScope       = "customscope"
)

type ClientCredentials struct {
	// ClientID is the identifier for the client.
	ClientID string `json:"client_id"`

	// ClientSecret is the secret key for the client.
	ClientSecret string `json:"client_secret"`

	// Issuer is the URL of the issuer.
	Issuer string `json:"issuer"`
}

// Idp defines methods for interacting with identity providers (IdPs).
type Idp interface {
	// TestSettings checks the connection and configuration of the IdP.
	TestSettings(ctx context.Context) error

	// Creates a new client credentials pair in the IdP.
	CreateClientCredentialsPair(ctx context.Context) (*ClientCredentials, error)
}

func getName(ctx context.Context) string {
	// Get the tenant ID from the context
	tenantId, ok := identitycontext.GetTenantID(ctx)
	if !ok {
		return ""
	}

	return fmt.Sprintf("%s%s", integrationPrefix, tenantId)
}
