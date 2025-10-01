// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package httputil_test

import (
	"fmt"
	"testing"

	"github.com/agntcy/identity-service/internal/pkg/httputil"
	"github.com/stretchr/testify/assert"
)

func TestHostname(t *testing.T) {
	t.Parallel()

	testCases := []*struct {
		input    string
		expected string
	}{
		{input: "https://www.cisco.com", expected: "www.cisco.com"},
		{input: "", expected: ""},
		{input: "cisco.com", expected: ""},
		{input: "whatever", expected: ""},
	}

	for _, tc := range testCases {
		t.Run(fmt.Sprintf("should pass for %s", tc.input), func(t *testing.T) {
			t.Parallel()

			ret := httputil.Hostname(tc.input)

			assert.Equal(t, tc.expected, ret)
		})
	}
}
