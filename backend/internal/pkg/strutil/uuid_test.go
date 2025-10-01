// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package strutil_test

import (
	"testing"

	"github.com/agntcy/identity-service/internal/pkg/ptrutil"
	"github.com/agntcy/identity-service/internal/pkg/strutil"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestSafeUuidString(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		val      *uuid.UUID
		expected *string
	}{
		"should return nil string": {val: nil, expected: nil},
		"should return a string UUID": {
			val:      ptrutil.Ptr(uuid.MustParse("26734fa9-fc30-4dfc-9c41-70bed7a1989f")),
			expected: ptrutil.Ptr("26734fa9-fc30-4dfc-9c41-70bed7a1989f"),
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			actual := strutil.SafeUuidString(tc.val)

			if tc.val == nil {
				assert.Equal(t, tc.expected, actual)
			} else {
				assert.Equal(t, *tc.expected, *actual)
			}
		})
	}
}

func TestSafeUuid(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		val      *string
		expected *uuid.UUID
	}{
		"should return nil uuid": {val: nil, expected: nil},
		"should return a UUID from string": {
			val:      ptrutil.Ptr("26734fa9-fc30-4dfc-9c41-70bed7a1989f"),
			expected: ptrutil.Ptr(uuid.UUID{0x26, 0x73, 0x4f, 0xa9, 0xfc, 0x30, 0x4d, 0xfc, 0x9c, 0x41, 0x70, 0xbe, 0xd7, 0xa1, 0x98, 0x9f}), //nolint:lll // keep it in one line
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			actual := strutil.SafeUuid(tc.val)

			if tc.val == nil {
				assert.Equal(t, tc.expected, actual)
			} else {
				assert.Equal(t, *tc.expected, *actual)
			}
		})
	}
}
