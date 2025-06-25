// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package strutil

import (
	"fmt"
	"math/rand"
	"time"
)

const extraLength = 2 // for hex encoding

func Random(length int) string {
	source := rand.NewSource(time.Now().UnixNano())
	rng := rand.New(source)
	b := make([]byte, length+extraLength)
	rng.Read(b)

	return fmt.Sprintf("%x", b)[2 : length+extraLength]
}
