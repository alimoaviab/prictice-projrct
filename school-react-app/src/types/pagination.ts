/**
 * Canonical paginated response envelope (matches backend `api.BuildPaginated`).
 *
 *   {
 *     items: T[],   // current page
 *     total: number,
 *     page:  number,
 *     limit: number,
 *     pages: number,
 *   }
 *
 * Every list endpoint that supports pagination returns this shape when
 * `?page=` / `?limit=` is sent. Without those params, list endpoints
 * return a plain array (legacy behavior preserved for backward compat).
 */
export interface Paginated<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    pages: number;
}

/** Convenience: pull just the meta out of a Paginated response. */
export function paginationMeta<T>(p: Paginated<T>) {
    return {
        total: p.total,
        page: p.page,
        limit: p.limit,
        pages: p.pages,
    };
}
