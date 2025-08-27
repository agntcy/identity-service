// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package testing

import (
	"context"
	"errors"

	"github.com/agntcy/identity/pkg/oidc"
)

type ValidAuthenticator struct{}

func NewValidAuthenticator() oidc.Authenticator {
	return &ValidAuthenticator{}
}

func (ValidAuthenticator) Token(
	ctx context.Context,
	issuer string,
	clientID string,
	clientSecret string,
) (string, error) {
	return "valid-access-token", nil
}

type ErroneousAuthenticator struct{}

func NewErroneousAuthenticator() oidc.Authenticator {
	return &ErroneousAuthenticator{}
}

func (ErroneousAuthenticator) Token(
	ctx context.Context,
	issuer string,
	clientID string,
	clientSecret string,
) (string, error) {
	return "", errors.New("invalid authentication")
}
