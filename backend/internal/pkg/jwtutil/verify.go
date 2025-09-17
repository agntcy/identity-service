// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package jwtutil

import (
	"errors"
	"fmt"

	"github.com/lestrrat-go/jwx/v3/jwt"
)

func Verify(
	jwtString string,
) error {
	if jwtString == "" {
		return errors.New("JWT string cannot be nil or empty")
	}

	_, err := jwt.Parse(
		[]byte(jwtString),
		jwt.WithVerify(false),
		jwt.WithValidate(true),
	)
	if err != nil {
		return fmt.Errorf("failed to parse JWT: %w", err)
	}

	return nil
}
