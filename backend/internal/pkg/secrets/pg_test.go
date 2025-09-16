// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package secrets_test

import (
	"testing"

	"github.com/google/uuid"
	"github.com/outshift/identity-service/internal/pkg/ptrutil"
	"github.com/outshift/identity-service/internal/pkg/secrets"
	"github.com/stretchr/testify/assert"
)

const (
	pgTestKey string = "1234567890123456"
)

func TestNewEncryptedString(t *testing.T) {
	t.Parallel()

	crypter := secrets.NewSymmetricCrypter([]byte(pgTestKey))

	es := secrets.NewEncryptedString(ptrutil.Ptr("happy"), crypter)

	assert.Equal(t, "AAAAAAAAAAAAAAAAyJUvYA9HiHRwemvQVRGUjXJiXYEH", string(*es))
}

func TestNewEncryptedString_should_return_nil(t *testing.T) {
	t.Parallel()

	assert.Nil(t, secrets.NewEncryptedString(nil, nil))
}

func TestNewEncryptedString_ToString(t *testing.T) {
	t.Parallel()

	raw := uuid.NewString()
	crypter := secrets.NewSymmetricCrypter([]byte(pgTestKey))

	es := secrets.NewEncryptedString(&raw, crypter)

	assert.Equal(t, raw, es.ToString(crypter))
}

func TestEncryptedStringToRaw(t *testing.T) {
	t.Parallel()

	raw := uuid.NewString()
	crypter := secrets.NewSymmetricCrypter([]byte(pgTestKey))

	es := secrets.NewEncryptedString(&raw, crypter)

	assert.Equal(t, raw, *secrets.EncryptedStringToRaw(es, crypter))
}

func TestEncryptedStringToRaw_should_return_nil(t *testing.T) {
	t.Parallel()

	assert.Nil(t, secrets.EncryptedStringToRaw(nil, nil))
}
