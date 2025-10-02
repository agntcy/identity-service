// Copyright 2025 AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package pagination_test

import (
	"testing"

	identity_service_shared_sdk_go "github.com/agntcy/identity-service/api/server/agntcy/identity/service/shared/v1alpha1"
	"github.com/agntcy/identity-service/internal/pkg/pagination"
	"github.com/agntcy/identity-service/internal/pkg/ptrutil"
	"github.com/stretchr/testify/assert"
)

func TestPagination_ConvertToPagedResponse(t *testing.T) {
	t.Parallel()

	itemsTotal := int64(100)
	itemsSize := int32(10)
	testCases := map[string]*struct {
		filter         pagination.PaginationFilter
		expectedResult *identity_service_shared_sdk_go.PagedResponse
	}{
		"should return a page with a reference to the next page": {
			filter: pagination.PaginationFilter{
				Page: ptrutil.Ptr(int32(3)),
				Size: &itemsSize,
			},
			expectedResult: &identity_service_shared_sdk_go.PagedResponse{
				HasNextPage: ptrutil.Ptr(true),
				NextPage:    ptrutil.Ptr(int32(4)),
				Total:       itemsTotal,
				Size:        itemsSize,
			},
		},
		"a page before the last one should point to the next page": {
			filter: pagination.PaginationFilter{
				Page: ptrutil.Ptr(int32(9)),
				Size: &itemsSize,
			},
			expectedResult: &identity_service_shared_sdk_go.PagedResponse{
				HasNextPage: ptrutil.Ptr(true),
				NextPage:    ptrutil.Ptr(int32(10)),
				Total:       itemsTotal,
				Size:        itemsSize,
			},
		},
		"the last page should not point to the next page": {
			filter: pagination.PaginationFilter{
				Page: ptrutil.Ptr(int32(10)),
				Size: &itemsSize,
			},
			expectedResult: &identity_service_shared_sdk_go.PagedResponse{
				HasNextPage: ptrutil.Ptr(false),
				NextPage:    nil,
				Total:       itemsTotal,
				Size:        itemsSize,
			},
		},
	}

	for tn, tc := range testCases {
		t.Run(tn, func(t *testing.T) {
			t.Parallel()

			items := &pagination.Pageable[int]{
				Size:  itemsSize,
				Total: itemsTotal,
			}

			actualResult := pagination.ConvertToPagedResponse(tc.filter, items)

			assert.Equal(t, tc.expectedResult, actualResult)
		})
	}
}
