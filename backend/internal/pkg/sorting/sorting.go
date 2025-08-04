// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package sorting

type Pageable[T any] struct {
	SortColumn *string
	SortDesc   *bool
}
