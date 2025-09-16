// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package strutil

const maskLength = 5

func Mask(secret string) string {
	if secret == "" {
		return ""
	}

	if len(secret) <= maskLength {
		return "*****"
	}

	return "*****" + secret[len(secret)-maskLength:]
}
