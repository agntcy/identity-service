// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package secrets

import "github.com/outshift/identity-service/internal/pkg/ptrutil"

type EncryptedString string

func NewEncryptedString(raw *string, crypter Crypter) *EncryptedString {
	if raw == nil {
		return nil
	}

	return ptrutil.Ptr(EncryptedString(crypter.Encrypt(*raw)))
}

func (es *EncryptedString) ToString(crypter Crypter) string {
	return crypter.Decrypt(string(*es))
}

func EncryptedStringToRaw(es *EncryptedString, crypter Crypter) *string {
	if es == nil {
		return nil
	}

	return ptrutil.Ptr(es.ToString(crypter))
}
