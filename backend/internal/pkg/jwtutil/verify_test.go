// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package jwtutil_test

import (
	"testing"

	"github.com/outshift/identity-service/internal/pkg/jwtutil"
	"github.com/stretchr/testify/assert"
)

func TestVerify_should_pass(t *testing.T) {
	t.Parallel()

	validJWT := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.xTauSR2dlM1bJuIiwlRHy0Sj-66g5_7qL2RKWT2u5J4" //nolint:lll // obviously JWTs are long

	assert.NoError(t, jwtutil.Verify(validJWT))
}

func TestVerify_should_return_err_when_jwt_is_empty(t *testing.T) {
	t.Parallel()

	err := jwtutil.Verify("")

	assert.Error(t, err)
	assert.ErrorContains(t, err, "JWT string cannot be nil or empty")
}

func TestVerify_should_return_err_when_jwt_is_invalid(t *testing.T) {
	t.Parallel()

	testCases := map[string]string{
		"JWT with invalid format": "INVALID",
		"expired JWT":             "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.K3_n_tvs5nD77qty7VbIoqsPM9RdhGie5CWliKGXdXg", //nolint:lll // obviously JWTs are long
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			err := jwtutil.Verify(tc)

			assert.Error(t, err)
			assert.ErrorContains(t, err, "failed to parse JWT")
		})
	}
}

func TestVerify_should_pass_when_jwt_has_invalid_signature(t *testing.T) {
	t.Parallel()

	jwtWithInvalidSign := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiAiMTIzNDU2Nzg5MCIsICAibmFtZSI6ICJKb2huIERvZSIsICJpYXQiOiAxNTE2MjM5MDIyfQ.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30" //nolint:lll // obviously JWTs are long

	assert.NoError(t, jwtutil.Verify(jwtWithInvalidSign))
}
