// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package types

type IdpConfig struct {
	// The client id of the identity provider
	ClientId string `json:"client_id,omitempty"`
	// The client secret of the identity provider
	ClientSecret string `json:"client_secret,omitempty"`
	// The issuer url of the identity provider
	IssuerUrl string `json:"issuer_url,omitempty"`
}
