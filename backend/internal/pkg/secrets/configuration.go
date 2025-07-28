package secrets

// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

type Configuration struct {
	SecretsCryptoKey string `split_words:"true" required:"true"`
}
