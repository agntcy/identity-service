// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package secrets

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/hex"
	"io"

	"github.com/agntcy/identity-platform/pkg/cmd"
	"github.com/agntcy/identity-platform/pkg/log"
)

// Encrypts a secret
func Encrypt(secret string) string {
	// Create byte array from the input string
	plainText := []byte(secret)

	// Create a new AES cipher using the key
	block, err := aes.NewCipher(getKey())
	if err != nil {
		log.Error("failed to create AES cipher:", err)
		return ""
	}

	// Make the cipher text a byte array of size BlockSize + the length of the message
	cipherText := make([]byte, aes.BlockSize+len(plainText))

	// iv is the ciphertext up to the blocksize (16)
	iv := cipherText[:aes.BlockSize]
	if _, err = io.ReadFull(rand.Reader, iv); err != nil {
		return ""
	}

	// Encrypt the data:
	stream := cipher.NewCTR(block, iv)
	stream.XORKeyStream(cipherText[aes.BlockSize:], plainText)

	// Return the encrypted secret in base64
	return hex.EncodeToString(cipherText)
}

// Decrypts a secret
func Decrypt(secretHex string) string {
	// Create a new AES cipher with the key and encrypted message
	block, err := aes.NewCipher(getKey())
	if err != nil {
		log.Error("failed to create AES cipher:", err)
		return ""
	}

	secret, decodeErr := hex.DecodeString(secretHex)
	if decodeErr != nil {
		return ""
	}

	// if the length of the cipherText is less than 16 Bytes:
	if len(secret) < aes.BlockSize {
		return ""
	}

	iv := secret[:aes.BlockSize]
	secret = secret[aes.BlockSize:]

	// Decrypt the message
	stream := cipher.NewCTR(block, iv)
	stream.XORKeyStream(secret, secret)

	return string(secret)
}

func getKey() []byte {
	config, _ := cmd.GetConfiguration[Configuration]()

	return []byte(config.SecretsCryptoKey)
}
