// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package errutil_test

import (
	"errors"
	"testing"

	"github.com/agntcy/identity-service/internal/pkg/errutil"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestIsDomainError(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		err            error
		expectedResult bool
	}{
		"should return true": {
			err:            errutil.InvalidRequest(uuid.NewString(), "something"),
			expectedResult: true,
		},
		"should return false": {
			err:            errors.New("random"),
			expectedResult: false,
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			assert.Equal(t, tc.expectedResult, errutil.IsDomainError(tc.err))
		})
	}
}
