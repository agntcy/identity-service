// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package testing

import (
	"context"
	"errors"

	"github.com/agntcy/identity/pkg/oidc"
)

const (
	ValidAccessToken string = "valid-access-token"
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
	return ValidAccessToken, nil
}

func (ValidAuthenticator) TokenWithScopes(
	ctx context.Context,
	issuer string,
	clientID string,
	clientSecret string,
	scopes []string,
) (string, error) {
	return ValidAccessToken, nil
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

func (ErroneousAuthenticator) TokenWithScopes(
	ctx context.Context,
	issuer string,
	clientID string,
	clientSecret string,
	scopes []string,
) (string, error) {
	return "", errors.New("invalid authentication")
}
