// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package auth

import (
	"github.com/go-openapi/runtime"
	httptransport "github.com/go-openapi/runtime/client"
)

func APIKeyAuth(apiKey string) runtime.ClientAuthInfoWriter {
	return httptransport.APIKeyAuth("x-id-api-key", "header", apiKey)
}

func BearerToken(token string) runtime.ClientAuthInfoWriter {
	return httptransport.BearerToken(token)
}
