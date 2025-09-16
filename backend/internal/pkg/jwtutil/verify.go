// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package jwtutil

import (
	"github.com/lestrrat-go/jwx/v3/jwt"
	"github.com/outshift/identity-service/internal/pkg/errutil"
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
