// Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
// SPDX-License-Identifier: Apache-2.0

package pagination

import identity_service_shared_sdk_go "github.com/agntcy/identity-service/api/server/agntcy/identity/service/shared/v1alpha1"

// Creates a PagedResponse object
func ConvertToPagedResponse[T any](
	paginationFilter PaginationFilter,
	items *Pageable[T],
) *identity_service_shared_sdk_go.PagedResponse {
	var nextPage *int32

	hasNextPage := int64(
		paginationFilter.GetPage(),
	)*int64(
		paginationFilter.GetLimit(),
	) < items.Total
	if hasNextPage {
		n := paginationFilter.GetPage() + 1
		nextPage = &n
	}

	return &identity_service_shared_sdk_go.PagedResponse{
		HasNextPage: &hasNextPage,
		NextPage:    nextPage,
		Total:       items.Total,
		Size:        items.Size,
	}
}
