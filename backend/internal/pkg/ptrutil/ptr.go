// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package ptrutil

// Ptr returns a pointer to the given value.
func Ptr[T any](v T) *T {
	return &v
}

func DerefStr(src *string) string {
	return Derefrence(src, "")
}

func Derefrence[T any](src *T, def T) T {
	if src != nil {
		return *src
	}

	return def
}
