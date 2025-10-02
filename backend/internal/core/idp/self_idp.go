// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package idp

import (
	"context"

	identitycontext "github.com/agntcy/identity-service/internal/pkg/context"
	"github.com/google/uuid"
)

type SelfIdp struct{}

func NewSelfIdp() Idp {
	return &SelfIdp{}
}

// CreateClientCredentialsPair implements Idp.
func (s *SelfIdp) CreateClientCredentialsPair(ctx context.Context) (*ClientCredentials, error) {
	userID, ok := identitycontext.GetUserID(ctx)
	if !ok {
		return nil, identitycontext.ErrUserNotFound
	}

	return &ClientCredentials{
		ClientID: uuid.NewString(),
		Issuer:   userID,
	}, nil
}

// DeleteClientCredentialsPair implements Idp.
func (s *SelfIdp) DeleteClientCredentialsPair(ctx context.Context, clientCredentials *ClientCredentials) error {
	return nil
}

// TestSettings implements Idp.
func (s *SelfIdp) TestSettings(ctx context.Context) error {
	return nil
}
