// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package joseutil_test

import (
	"testing"

	"github.com/agntcy/identity-platform/internal/core/id/types"
	"github.com/agntcy/identity-platform/internal/pkg/joseutil"
	"github.com/stretchr/testify/assert"
)

func TestGenerateAndValidateKeys(t *testing.T) {
	t.Parallel()

	algorithms := []string{"RS256", "RS384", "RS512"}

	for _, alg := range algorithms {
		t.Run(alg, func(t *testing.T) {
			t.Parallel()

			jwk, err := joseutil.GenerateJWK(alg, "sig", "")
			assert.NoError(t, err, "GenerateJWK failed for %s", alg)

			// Validate public key (should pass)
			err = joseutil.ValidatePubKey(jwk.PublicKey())
			assert.NoError(t, err, "ValidatePubKey failed for %s", alg)

			// Validate private key (should pass)
			err = joseutil.ValidatePrivKey(jwk)
			assert.NoError(t, err, "ValidatePrivKey failed for %s", alg)

			// Public key with private fields should fail
			err = joseutil.ValidatePubKey(jwk)
			assert.Error(
				t,
				err,
				"ValidatePubKey should fail if private fields are present for %s",
				alg,
			)
		})
	}
}

func TestValidatePubKey_NilOrEmptyFields(t *testing.T) {
	t.Parallel()

	// Test nil Jwk pointer
	var nilJwk *types.Jwk
	err := joseutil.ValidatePubKey(nilJwk)
	assert.Error(t, err, "ValidatePubKey should fail if Jwk is nil")

	// Test Jwk with missing required fields for RSA
	jwk := &types.Jwk{KTY: "RSA"}
	err = joseutil.ValidatePubKey(jwk)
	assert.Error(t, err, "ValidatePubKey should fail if required RSA fields are missing")
}

func TestGenerateJWK_UnsupportedAlgorithm(t *testing.T) {
	t.Parallel()

	_, err := joseutil.GenerateJWK("unsupported-alg", "sig", "")
	assert.Error(t, err, "Expected error for unsupported algorithm")
}

func TestSignAndVerify(t *testing.T) {
	t.Parallel()

	algorithms := []string{"RS256", "RS384", "RS512"}
	payload := []byte(`{"test":"data"}`)

	for _, alg := range algorithms {
		t.Run(alg, func(t *testing.T) {
			t.Parallel()

			// Generate a key pair
			jwk, err := joseutil.GenerateJWK(alg, "sig", "")
			assert.NoError(t, err, "GenerateJWK failed")

			// Get the public key
			publicKey := jwk.PublicKey()

			// Sign the payload with the private key
			signature, err := joseutil.Sign(jwk, payload)
			assert.NoError(t, err, "Sign failed")
			assert.NotEmpty(t, signature, "Signature should not be empty")

			// Verify the signature with the public key
			verified, err := joseutil.Verify(publicKey, signature)
			assert.NoError(t, err, "Verification failed")
			assert.Equal(t, payload, verified, "Verified payload should match original")

			// Try to verify with an invalid signature
			invalidSig := append([]byte(nil), signature...)
			invalidSig[len(invalidSig)-1] ^= 0xFF // flip some bits
			_, err = joseutil.Verify(publicKey, invalidSig)
			assert.Error(t, err, "Verification should fail with invalid signature")
		})
	}
}

func TestSignAndVerifyErrors(t *testing.T) {
	t.Parallel()

	payload := []byte(`{"test":"data"}`)

	// Generate a key
	jwk, err := joseutil.GenerateJWK("RS256", "sig", "")
	assert.NoError(t, err, "GenerateJWK failed")
	publicKey := jwk.PublicKey()

	// Test nil keys
	_, err = joseutil.Sign(nil, payload)
	assert.Error(t, err, "Sign should fail with nil key")

	_, err = joseutil.Verify(nil, payload)
	assert.Error(t, err, "Verify should fail with nil key")

	// Test unsupported algorithm
	jwk.ALG = "UNSUPPORTED"
	_, err = joseutil.Sign(jwk, payload)
	assert.Error(t, err, "Sign should fail with unsupported algorithm")

	publicKey.ALG = "UNSUPPORTED"
	_, err = joseutil.Verify(publicKey, payload)
	assert.Error(t, err, "Verify should fail with unsupported algorithm")
}
