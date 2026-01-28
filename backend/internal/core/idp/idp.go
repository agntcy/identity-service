// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package idp

import (
	"context"
	"fmt"

	"github.com/google/uuid"
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

	// Scopes is the optional list of scopes to request when
	// obtaining tokens from the IdP. When empty, callers will
	// fall back to the default token flow without explicit scopes.
	Scopes []string `json:"scopes,omitempty"`
}

// Idp defines methods for interacting with identity providers (IdPs).
type Idp interface {
	// TestSettings checks the connection and configuration of the IdP.
	TestSettings(ctx context.Context) error

	// Creates a new client credentials pair in the IdP.
	CreateClientCredentialsPair(ctx context.Context) (*ClientCredentials, error)

	// DeleteClientCredentialsPair deletes a client credentials pair in the IdP.
	DeleteClientCredentialsPair(ctx context.Context, clientCredentials *ClientCredentials) error
}

func getName() string {
	return fmt.Sprintf("%s%s", integrationPrefix, uuid.NewString())
}
