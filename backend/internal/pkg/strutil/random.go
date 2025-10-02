// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package strutil

import (
	"crypto/rand" // math/rand is not considered cryptographically secure
	"fmt"
)

const extraLength = 2 // for hex encoding

func Random(length int) string {
	if length < 0 {
		return ""
	}

	b := make([]byte, length+extraLength)
	_, _ = rand.Read(b) // Default reader uses OS APIs that never return an error

	return fmt.Sprintf("%x", b)[2 : length+extraLength]
}
