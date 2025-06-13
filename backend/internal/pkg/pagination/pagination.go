package pagination

import identity_platform_shared_sdk_go "github.com/agntcy/identity-platform/api/server/agntcy/identity/platform/shared/v1alpha1"

// Creates a PagedResponse object
func ConvertToPagedResponse[T any](
	paginationFilter PaginationFilter,
	items *Pageable[T],
) *identity_platform_shared_sdk_go.PagedResponse {
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

	return &identity_platform_shared_sdk_go.PagedResponse{
		HasNextPage: &hasNextPage,
		NextPage:    nextPage,
		Total:       items.Total,
		Size:        items.Size,
	}
}
