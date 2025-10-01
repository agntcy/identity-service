// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package strutil_test

import (
	"fmt"
	"testing"

	"github.com/agntcy/identity-service/internal/pkg/strutil"
	"github.com/stretchr/testify/assert"
)

func TestMask_should_show_only_last_5_chars(t *testing.T) {
	t.Parallel()

	testCases := []*struct {
		secret   string
		expected string
	}{
		{secret: "123456", expected: "*****23456"},
		{secret: "1234567", expected: "*****34567"},
		{secret: "12345678", expected: "*****45678"},
	}

	for _, tc := range testCases {
		t.Run(fmt.Sprintf("mask %s to %s", tc.secret, tc.expected), func(t *testing.T) {
			t.Parallel()

			actual := strutil.Mask(tc.secret)

			assert.Equal(t, tc.expected, actual)
		})
	}
}

func TestMask_should_mask_fully_secret_less_than_or_equal_5_chars(t *testing.T) {
	t.Parallel()

	testCases := []string{"1", "12", "123", "1234", "12345"}

	for _, tc := range testCases {
		t.Run(fmt.Sprintf("mask fully %s", tc), func(t *testing.T) {
			t.Parallel()

			actual := strutil.Mask(tc)

			assert.Equal(t, "*****", actual)
		})
	}
}

func TestMask_should_return_empty_string_on_empty_input(t *testing.T) {
	t.Parallel()

	assert.Empty(t, strutil.Mask(""))
}
