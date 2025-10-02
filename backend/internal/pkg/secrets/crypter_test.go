// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package secrets_test

import (
	"fmt"
	"testing"

	"github.com/agntcy/identity-service/internal/pkg/secrets"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

const (
	crypterTestKey = "1234567890123456"
)

func TestEncrypt_Decrypt(t *testing.T) {
	t.Parallel()

	testCases := []*struct {
		raw       string
		encrypted string
	}{
		{
			raw:       "don't",
			encrypted: "AAAAAAAAAAAAAAAAxJsxNwL5M+PFsLWWUclg0TGIkYdB",
		},
		{
			raw:       "worry",
			encrypted: "AAAAAAAAAAAAAAAA15stYg8CkNJbrkSitt9TPPW2rpy9",
		},
		{
			raw:       "be",
			encrypted: "AAAAAAAAAAAAAAAAwpG0M366+azi80EDv1SD/GSx",
		},
		{
			raw:       "happy",
			encrypted: "AAAAAAAAAAAAAAAAyJUvYA9HiHRwemvQVRGUjXJiXYEH",
		},
		{
			raw:       "",
			encrypted: "AAAAAAAAAAAAAAAAtzMPt8lXgvw9Z+fDpmco2g",
		},
	}

	for _, tc := range testCases {
		t.Run(fmt.Sprintf("test encryption for %s", tc.raw), func(t *testing.T) {
			t.Parallel()

			sut := secrets.NewSymmetricCrypter([]byte(crypterTestKey))

			enc := sut.Encrypt(tc.raw)
			dec := sut.Decrypt(enc)

			assert.Equal(t, tc.encrypted, enc)
			assert.Equal(t, tc.raw, dec)
		})
	}
}

func TestEncrypt_should_not_accept_an_invalid_key(t *testing.T) {
	t.Parallel()

	testCases := map[string][]byte{
		"invalid AES-128 key 1": generateKey(15),
		"invalid AES-128 key 2": generateKey(17),
		"invalid AES-192 key 1": generateKey(23),
		"invalid AES-192 key 2": generateKey(25),
		"invalid AES-256 key 1": generateKey(31),
		"invalid AES-256 key 2": generateKey(33),
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			sut := secrets.NewSymmetricCrypter(tc)

			ret := sut.Encrypt("something")

			assert.Empty(t, ret)
		})
	}
}

func TestDecrypt_should_not_accept_an_invalid_base64(t *testing.T) {
	t.Parallel()

	notBase64Value := uuid.NewString()
	sut := secrets.NewSymmetricCrypter(generateKey(16))

	dec := sut.Decrypt(notBase64Value)

	assert.Empty(t, dec)
}

func generateKey(size int) []byte {
	key := make([]byte, 0, size)
	for range size {
		key = append(key, 'A')
	}

	return key
}
