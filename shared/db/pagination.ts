/**
 * Centralized pagination helper for list endpoints.
 *
 * Optimization rules:
 *  - Pagination is opt-in. If the caller does NOT pass `page` or `limit`, the
 *    current behavior is preserved (returning a plain array) so existing UIs
 *    that consume `Array<T>` keep working.
 *  - When the caller passes `page` or `limit`, the service may return either:
 *      * `{ items, total, page, limit, pages }`  (recommended for new UIs), OR
 *      * a plain array sliced to the page (when `paginate` is "soft").
 *
 * Both shapes are wrapped in `ServiceResult<T>` upstream, so the API envelope
 * is unchanged.
 */
export type PaginationInput = {
    page?: string | number;
    limit?: string | number;
};

export type PaginationParams = {
    enabled: boolean;
    page: number;
    limit: number;
    skip: number;
};

export type Paginated<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
    pages: number;
};

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 200;

export function parsePagination(input: PaginationInput | undefined, defaults: { defaultLimit?: number; maxLimit?: number } = {}): PaginationParams {
    const defaultLimit = defaults.defaultLimit ?? DEFAULT_LIMIT;
    const maxLimit = defaults.maxLimit ?? MAX_LIMIT;

    const hasPage = input?.page !== undefined && input.page !== "" && input.page !== null;
    const hasLimit = input?.limit !== undefined && input.limit !== "" && input.limit !== null;
    const enabled = hasPage || hasLimit;

    let page = Number(input?.page ?? 1);
    let limit = Number(input?.limit ?? defaultLimit);
    if (!Number.isFinite(page) || page < 1) page = 1;
    if (!Number.isFinite(limit) || limit < 1) limit = defaultLimit;
    if (limit > maxLimit) limit = maxLimit;

    return {
        enabled,
        page,
        limit,
        skip: (page - 1) * limit
    };
}

export function buildPaginatedResponse<T>(items: T[], total: number, params: PaginationParams): Paginated<T> {
    return {
        items,
        total,
        page: params.page,
        limit: params.limit,
        pages: Math.max(1, Math.ceil(total / params.limit))
    };
}
