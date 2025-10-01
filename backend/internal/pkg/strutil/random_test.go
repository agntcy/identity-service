// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package strutil_test

import (
	"fmt"
	"testing"

	"github.com/agntcy/identity-service/internal/pkg/strutil"
	"github.com/stretchr/testify/assert"
)

func TestRandom_returns_correct_length(t *testing.T) {
	t.Parallel()

	testCases := []int{20, 1, 40, 342}

	for _, tc := range testCases {
		t.Run(fmt.Sprintf("generate random string with length %d", tc), func(t *testing.T) {
			t.Parallel()

			ret := strutil.Random(tc)

			assert.Len(t, ret, tc)
		})
	}
}

func TestRandom_different_outputs_for_same_length(t *testing.T) {
	t.Parallel()

	length := 15

	output := make([]string, 0)

	for range 10 {
		output = append(output, strutil.Random(length))
	}

	for i, str1 := range output {
		assert.NotContains(t, output[:i], str1)
		assert.NotContains(t, output[i+1:], str1)
	}
}

func TestRandom_return_empty_str_when_length_is_zero(t *testing.T) {
	t.Parallel()

	assert.Empty(t, strutil.Random(0))
}

func TestRandom_NegativeLength(t *testing.T) {
	t.Parallel()

	assert.Empty(t, strutil.Random(-1))
}
