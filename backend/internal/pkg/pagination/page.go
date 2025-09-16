// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package pagination

type Pageable[T any] struct {
	Items []*T
	Total int64
	Page  int32
	Size  int32
}
