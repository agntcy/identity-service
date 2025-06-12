// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package jwtutil

import (
	"encoding/json"

	"github.com/agntcy/identity-platform/internal/core/id/types"
	"github.com/agntcy/identity-platform/internal/pkg/joseutil"
)

func Jwt(issuer, sub string, key *types.Jwk) (string, error) {
	payload := map[string]any{
		"iss": issuer,
		"sub": sub,
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	token, err := joseutil.Sign(key, payloadBytes)
	if err != nil {
		return "", err
	}

	return string(token), nil
}
