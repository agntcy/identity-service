// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package gormutil

import (
	"github.com/agntcy/identity-platform/internal/pkg/pagination"
	"gorm.io/gorm"
)

func Paginate(filter pagination.PaginationFilter) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Offset(int(filter.GetSkip())).Limit(int(filter.GetLimit()))
	}
}
