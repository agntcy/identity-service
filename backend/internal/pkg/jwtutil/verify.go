// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package jwtutil

import (
	"encoding/json"

	"github.com/agntcy/identity-platform/internal/pkg/errutil"
	"github.com/agntcy/identity-platform/internal/pkg/ptrutil"
	"github.com/lestrrat-go/jwx/v3/jwt"
)

func Verify(
	jwtString string,
) error {
	if jwtString == "" {
		return errutil.Err(
			nil,
			"JWT string cannot be nil or empty",
		)
	}

	_, err := jwt.Parse(
		[]byte(jwtString),
		jwt.WithVerify(false),
		jwt.WithValidate(true),
	)
	if err != nil {
		return errutil.Err(
			err,
			"failed to parse JWT",
		)
	}

	return nil
}

func GetClaim(
	jwtString *string,
	claimName string,
) (*string, error) {
	if jwtString == nil || *jwtString == "" {
		return nil, errutil.Err(
			nil,
			"JWT string cannot be nil or empty",
		)
	}

	token, err := jwt.Parse(
		[]byte(*jwtString),
		jwt.WithVerify(false),
		jwt.WithValidate(true),
	)
	if err != nil {
		return nil, errutil.Err(
			err,
			"failed to parse JWT",
		)
	}

	var claimValue map[string]any

	err = token.Get(claimName, &claimValue)
	if err != nil {
		return nil, errutil.Err(
			err,
			"claim not found in JWT",
		)
	}

	// Convert the claim value to a string
	rawClaims, err := json.Marshal(&claimValue)
	if err != nil {
		return nil, errutil.Err(
			err,
			"failed to marshal claim value to JSON",
		)
	}

	return ptrutil.Ptr(string(rawClaims)), nil
}
