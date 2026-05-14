package api

import (
	"net/url"
	"strconv"
)

// PaginationParams mirrors the helper from old-app/shared/db/pagination.ts.
type PaginationParams struct {
	Enabled bool
	Page    int
	Limit   int
	Skip    int
}

// Paginated mirrors the original Paginated<T> shape exactly so the React
// frontend's `usePaginatedList` consumes the same fields.
type Paginated[T any] struct {
	Items []T `json:"items"`
	Total int `json:"total"`
	Page  int `json:"page"`
	Limit int `json:"limit"`
	Pages int `json:"pages"`
}

// ParsePagination reads `page` and `limit` from a URL query, applying the
// same defaults as parsePagination in the Node helper.
func ParsePagination(q url.Values) PaginationParams {
	const defaultLimit = 25
	const maxLimit = 200

	hasPage := q.Get("page") != ""
	hasLimit := q.Get("limit") != ""
	enabled := hasPage || hasLimit

	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit < 1 {
		limit = defaultLimit
	}
	if limit > maxLimit {
		limit = maxLimit
	}

	return PaginationParams{
		Enabled: enabled,
		Page:    page,
		Limit:   limit,
		Skip:    (page - 1) * limit,
	}
}

// BuildPaginated mirrors `buildPaginatedResponse`.
func BuildPaginated[T any](items []T, total int, p PaginationParams) Paginated[T] {
	pages := total / p.Limit
	if total%p.Limit != 0 {
		pages++
	}
	if pages < 1 {
		pages = 1
	}
	return Paginated[T]{
		Items: items,
		Total: total,
		Page:  p.Page,
		Limit: p.Limit,
		Pages: pages,
	}
}
