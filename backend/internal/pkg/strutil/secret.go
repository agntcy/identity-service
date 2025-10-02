// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
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
