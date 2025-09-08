// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package secrets

import (
	"crypto/aes"
	"crypto/cipher"
	"encoding/base64"

	"github.com/outshift/identity-service/pkg/log"
)

type Crypter interface {
	Encrypt(secret string) string
	Decrypt(secretHex string) string
}

type symmetricCrypter struct {
	key []byte
}

func NewSymmetricCrypter(key []byte) Crypter {
	return &symmetricCrypter{key: key}
}

// Encrypts a secret
func (c *symmetricCrypter) Encrypt(secret string) string {
	plainText := []byte(secret)

	// Create a new AES cipher using the key
	block, err := aes.NewCipher(c.key)
	if err != nil {
		log.Error("Got error creating new cypher: ", err)
		return ""
	}

	// Encrypt the data:
	gcm, gcmErr := cipher.NewGCM(block)
	if gcmErr != nil {
		log.Error("Got error creating new GCM: ", gcmErr)
		return ""
	}

	// Nonce
	nonce := make([]byte, gcm.NonceSize())

	cipherText := gcm.Seal(nonce, nonce, plainText, nil)

	// Return the encrypted secret in base64
	return base64.RawStdEncoding.EncodeToString(cipherText)
}

// Decrypts a secret
func (c *symmetricCrypter) Decrypt(secretHex string) string {
	// Create a new AES cipher with the key and encrypted message
	block, err := aes.NewCipher(c.key)
	if err != nil {
		log.Error("Got error creating new cypher: ", err)
		return ""
	}

	secret, decodeErr := base64.RawStdEncoding.DecodeString(secretHex)
	if decodeErr != nil {
		log.Error("Got error decoding secret: ", decodeErr)
		return ""
	}

	gcm, gcmErr := cipher.NewGCM(block)
	if gcmErr != nil {
		log.Error("Got error creating new GCM: ", gcmErr)
		return ""
	}

	// if the length of the cipherText is less than 16 Bytes:
	nonceSize := gcm.NonceSize()
	if len(secret) < nonceSize {
		log.Error("cipherText is too short")
		return ""
	}

	nonce, ciphertext := secret[:nonceSize], secret[nonceSize:]

	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		log.Error("Got error decrypting secret: ", err)
	}

	return string(plaintext)
}
