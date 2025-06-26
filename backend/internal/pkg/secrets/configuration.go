package secrets

// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

type Configuration struct {
	SecretsCryptoKey string `split_words:"true" required:"true"`
}
