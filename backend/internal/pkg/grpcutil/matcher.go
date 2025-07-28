// Copyright 2025 Cisco Systems, Inc. and its affiliates
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
