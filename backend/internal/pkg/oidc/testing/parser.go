// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package testing

import (
	"context"

	"github.com/agntcy/identity-saas/internal/pkg/oidc"
)

type fakeParser struct {
	result *oidc.ParsedJWT
	err    error
}

func NewFakeParser(
	result *oidc.ParsedJWT,
	err error,
) oidc.Parser {
	return &fakeParser{
		result: result,
		err:    err,
	}
}

func (p *fakeParser) ParseAndVerifyJwt(
	ctx context.Context,
	jwtString *string,
	jwksString *string,
) (*oidc.ParsedJWT, error) {
	return p.ParseJwt(ctx, jwtString), p.err
}

func (p *fakeParser) VerifyJwt(
	ctx context.Context,
	parsedJwt *oidc.ParsedJWT,
	jwksString *string,
) error {
	return nil
}

func (p *fakeParser) ParseJwt(
	ctx context.Context,
	jwtString *string,
) *oidc.ParsedJWT {
	return p.result
}
