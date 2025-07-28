// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Settingsentifier: Apache-2.0

package idp

import (
	"context"
	"errors"

	identitycontext "github.com/outshift/identity-service/internal/pkg/context"
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
		return nil, errors.New("user id not found in context")
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
