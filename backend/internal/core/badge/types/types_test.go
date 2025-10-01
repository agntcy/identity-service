// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package types_test

import (
	"testing"

	"github.com/agntcy/identity-service/internal/core/badge/types"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestBadge_IsRevoked(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		purpose        types.CredentialStatusPurpose
		expectedResult bool
	}{
		"should return true": {
			purpose:        types.CREDENTIAL_STATUS_PURPOSE_REVOCATION,
			expectedResult: true,
		},
		"should return false": {
			purpose:        types.CREDENTIAL_STATUS_PURPOSE_UNSPECIFIED,
			expectedResult: false,
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			sut := types.Badge{
				VerifiableCredential: types.VerifiableCredential{
					Status: []*types.CredentialStatus{
						{
							Purpose: tc.purpose,
						},
					},
				},
			}

			actual := sut.IsRevoked()

			assert.Equal(t, tc.expectedResult, actual)
		})
	}
}

func TestCredentialStatusPurpose_UnmarshalText(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		text            string
		expectedPurpose types.CredentialStatusPurpose
	}{
		"should return CREDENTIAL_STATUS_PURPOSE_REVOCATION": {
			text:            "CREDENTIAL_STATUS_PURPOSE_REVOCATION",
			expectedPurpose: types.CREDENTIAL_STATUS_PURPOSE_REVOCATION,
		},
		"should return CREDENTIAL_STATUS_PURPOSE_UNSPECIFIED": {
			text:            "CREDENTIAL_STATUS_PURPOSE_UNSPECIFIED",
			expectedPurpose: types.CREDENTIAL_STATUS_PURPOSE_UNSPECIFIED,
		},
		"should return CREDENTIAL_STATUS_PURPOSE_UNSPECIFIED as default": {
			text:            "whatever",
			expectedPurpose: types.CREDENTIAL_STATUS_PURPOSE_UNSPECIFIED,
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			actualPurpose := types.CREDENTIAL_STATUS_PURPOSE_UNSPECIFIED

			err := actualPurpose.UnmarshalText([]byte(tc.text))

			assert.NoError(t, err)
			assert.Equal(t, tc.expectedPurpose, actualPurpose)
		})
	}
}

func TestCredentialStatusPurpose_MarshalText(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		purpose      types.CredentialStatusPurpose
		expectedText string
	}{
		"should return CREDENTIAL_STATUS_PURPOSE_REVOCATION": {
			purpose:      types.CREDENTIAL_STATUS_PURPOSE_REVOCATION,
			expectedText: "CREDENTIAL_STATUS_PURPOSE_REVOCATION",
		},
		"should return CREDENTIAL_STATUS_PURPOSE_UNSPECIFIED": {
			purpose:      types.CREDENTIAL_STATUS_PURPOSE_UNSPECIFIED,
			expectedText: "CREDENTIAL_STATUS_PURPOSE_UNSPECIFIED",
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			actualText, err := tc.purpose.MarshalText()

			assert.NoError(t, err)
			assert.Equal(t, []byte(tc.expectedText), actualText)
		})
	}
}

func TestProof_IsJOSE(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		proofType      string
		expectedResult bool
	}{
		"should return true when type is jwt": {
			proofType:      types.JoseProof,
			expectedResult: true,
		},
		"should return false when type is not jwt": {
			proofType:      uuid.NewString(),
			expectedResult: false,
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			sut := types.Proof{Type: tc.proofType}

			actual := sut.IsJOSE()

			assert.Equal(t, tc.expectedResult, actual)
		})
	}
}
