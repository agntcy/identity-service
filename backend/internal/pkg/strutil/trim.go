// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package strutil

import (
	"slices"
	"strings"
)

func TrimSpaceAndNewline(s string) string {
	if s == "" {
		return s
	}

	s = strings.TrimSpace(s)
	s = strings.ReplaceAll(s, "\n", "")
	s = strings.ReplaceAll(s, "\r", "")
	s = strings.ReplaceAll(s, "\t", "")

	return s
}

func TrimSlice(s []string) []string {
	return slices.DeleteFunc(s, func(s string) bool { return s == "" })
}
