// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package pgutil_test

import (
	"database/sql"
	"testing"
	"time"

	"github.com/outshift/identity-service/internal/pkg/pgutil"
	"github.com/outshift/identity-service/internal/pkg/ptrutil"
	"github.com/stretchr/testify/assert"
)

func TestSqlNullTimeToTime(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		t              sql.NullTime
		expectedResult *time.Time
	}{
		"should return a pointer to a valid time": {
			t:              sql.NullTime{Valid: true, Time: time.Unix(1756918916, 0)},
			expectedResult: ptrutil.Ptr(time.Unix(1756918916, 0)),
		},
		"should return nil when NullTime is invalid": {
			t:              sql.NullTime{Valid: false},
			expectedResult: nil,
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			actualResult := pgutil.SqlNullTimeToTime(tc.t)

			assert.Equal(t, tc.expectedResult, actualResult)
		})
	}
}

func TestTimeToSqlNullTime(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		t              *time.Time
		expectedResult sql.NullTime
	}{
		"should return a valid instance of NullTime": {
			t:              ptrutil.Ptr(time.Unix(1756918916, 0)),
			expectedResult: sql.NullTime{Valid: true, Time: time.Unix(1756918916, 0)},
		},
		"should return invalid NullTime when t is nil": {
			t:              nil,
			expectedResult: sql.NullTime{Valid: false},
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			actualResult := pgutil.TimeToSqlNullTime(tc.t)

			assert.Equal(t, tc.expectedResult, actualResult)
		})
	}
}
