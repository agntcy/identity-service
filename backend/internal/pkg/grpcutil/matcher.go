// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package grpcutil

import (
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
)

func CustomMatcher(key string) (string, bool) {
	switch key {
	case "X-Id-Api-Key":
		return key, true
	default:
		return runtime.DefaultHeaderMatcher(key)
	}
}
