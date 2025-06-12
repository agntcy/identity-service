package pagination

const (
	defaultPage int32 = 1
)

type PaginationFilter struct {
	Page        *int32
	Size        *int32
	DefaultSize int32
}

func (f PaginationFilter) GetPage() int32 {
	if f.Page != nil && *f.Page > 0 {
		return *f.Page
	}

	return defaultPage
}

func (f PaginationFilter) GetLimit() int32 {
	if f.Size != nil && *f.Size > 0 {
		return *f.Size
	}

	return f.DefaultSize
}

func (f PaginationFilter) GetSkip() int32 {
	if f.Page != nil && *f.Page > 0 {
		return (*f.Page - 1) * f.GetLimit()
	}

	return (defaultPage - 1) * f.DefaultSize
}
