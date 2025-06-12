package pagination

type Pageable[T any] struct {
	Items []*T
	Total int64
	Page  int32
	Size  int32
}
