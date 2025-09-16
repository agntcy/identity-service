// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package pgutil

import (
	"database/sql"
	"time"
)

func SqlNullTimeToTime(t sql.NullTime) *time.Time {
	if t.Valid {
		return &t.Time
	}

	return nil
}

func TimeToSqlNullTime(t *time.Time) sql.NullTime {
	if t != nil {
		return sql.NullTime{Time: *t, Valid: true}
	}

	return sql.NullTime{Valid: false}
}
