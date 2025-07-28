// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package jwtutil

import (
	"github.com/agntcy/identity-service/internal/pkg/errutil"
	"github.com/agntcy/identity-service/pkg/log"
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
	claimValue interface{},
) error {
	if jwtString == nil || *jwtString == "" {
		return errutil.Err(
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
		return errutil.Err(
			err,
			"failed to parse JWT",
		)
	}

	err = token.Get(claimName, claimValue)
	if err != nil {
		return errutil.Err(
			err,
			"claim not found in JWT",
		)
	}

	log.Debug("JWT claim: ", claimName, " found with value: ", claimValue)

	return nil
}
