// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package strutil_test

import (
	"testing"

	"github.com/outshift/identity-service/internal/pkg/strutil"
	"github.com/stretchr/testify/assert"
)

func TestTrimSpaceAndNewline(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		val      string
		expected string
	}{
		"should return empty string": {val: "", expected: ""},
		"should not trim":            {val: "something", expected: "something"},
		"should trim \\n":            {val: "something\n", expected: "something"},
		"should trim \\r":            {val: "something\r", expected: "something"},
		"should trim \\t":            {val: "something\t", expected: "something"},
		"should trim all":            {val: "something\n\r\t", expected: "something"},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			actual := strutil.TrimSpaceAndNewline(tc.val)

			assert.Equal(t, tc.expected, actual)
		})
	}
}

func TestTrimSlice(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		slice    []string
		expected []string
	}{
		"should return empty slice":                       {slice: []string{""}, expected: []string{}},
		"should return slice with only the last element":  {slice: []string{"", "last"}, expected: []string{"last"}},
		"should return slice with only the first element": {slice: []string{"first", ""}, expected: []string{"first"}},
		"should remove the empty string in the middle":    {slice: []string{"first", "", "last"}, expected: []string{"first", "last"}},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			actual := strutil.TrimSlice(tc.slice)

			assert.Equal(t, tc.expected, actual)
		})
	}
}
