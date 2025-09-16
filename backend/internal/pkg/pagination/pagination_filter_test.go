// Copyright 2025 Cisco Systems, Inc. and its affiliates
// SPDX-License-Identifier: Apache-2.0

package pagination_test

import (
	"testing"

	"github.com/outshift/identity-service/internal/pkg/pagination"
	"github.com/outshift/identity-service/internal/pkg/ptrutil"
	"github.com/stretchr/testify/assert"
)

func TestPaginationFilter_GetPage(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		filter       *pagination.PaginationFilter
		expectedPage int32
	}{
		"should return the page located in the filter": {
			filter: &pagination.PaginationFilter{
				Page: ptrutil.Ptr(int32(1337)),
			},
			expectedPage: 1337,
		},
		"should return the default page when the filter page is 0": {
			filter: &pagination.PaginationFilter{
				Page: ptrutil.Ptr(int32(0)),
			},
			expectedPage: 1,
		},
		"should return the default page when the filter page is nil": {
			filter: &pagination.PaginationFilter{
				Page: nil,
			},
			expectedPage: 1,
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			assert.Equal(t, tc.expectedPage, tc.filter.GetPage())
		})
	}
}

func TestPaginationFilter_GetLimit(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		filter        *pagination.PaginationFilter
		expectedLimit int32
	}{
		"should return the limit located in the filter": {
			filter: &pagination.PaginationFilter{
				Size: ptrutil.Ptr(int32(1337)),
			},
			expectedLimit: 1337,
		},
		"should return the default size when the filter size is 0": {
			filter: &pagination.PaginationFilter{
				Size:        ptrutil.Ptr(int32(0)),
				DefaultSize: 20,
			},
			expectedLimit: 20,
		},
		"should return the default size when the filter size is nil": {
			filter: &pagination.PaginationFilter{
				Size:        nil,
				DefaultSize: 20,
			},
			expectedLimit: 20,
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			assert.Equal(t, tc.expectedLimit, tc.filter.GetLimit())
		})
	}
}

func TestPaginationFilter_GetSkip(t *testing.T) {
	t.Parallel()

	testCases := map[string]*struct {
		filter       *pagination.PaginationFilter
		expectedSkip int32
	}{
		"should calculate the skip based on the filter's size and page values": {
			filter: &pagination.PaginationFilter{
				Page: ptrutil.Ptr(int32(3)),
				Size: ptrutil.Ptr(int32(10)),
			},
			expectedSkip: 20, // (3 - 1) * 10
		},
		"should calculate the skip based on the default size and page values": {
			filter: &pagination.PaginationFilter{
				Page:        ptrutil.Ptr(int32(0)),
				DefaultSize: 20,
			},
			expectedSkip: 0, // (1 - 1) * 20
		},
		"should calculate the skip based on the default size and page values when filter page is nil": {
			filter: &pagination.PaginationFilter{
				Page:        nil,
				DefaultSize: 20,
			},
			expectedSkip: 0, // (1 - 1) * 20
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			assert.Equal(t, tc.expectedSkip, tc.filter.GetSkip())
		})
	}
}
