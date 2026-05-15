/**
 * Shared pagination hook for every list/table page.
 *
 * Solves the recurring bugs:
 *   - Deleting the last record on a page leaves the user on an empty page
 *   - Filters/search changes don't reset back to page 1
 *   - Page state can hold a number greater than `pages` after data shrinks
 *   - Toolbar code duplicates pagination math everywhere
 *
 * Backend contract (matches api.BuildPaginated):
 *   {
 *     items: T[],
 *     total: number,
 *     page:  number,
 *     limit: number,
 *     pages: number,
 *   }
 *
 * Usage:
 *   const pagination = usePagination({ defaultLimit: 25 });
 *
 *   // Read by your data hook:
 *   const { state } = useTeachers({ page: pagination.page, limit: pagination.limit });
 *
 *   // Tell the hook how big the dataset really is (so it can clamp):
 *   pagination.applyMeta(state.data?.meta);
 *
 *   // After a destructive action:
 *   await deleteTeacher(id);
 *   pagination.handleItemRemoved(state.data?.items.length ?? 0);
 *
 *   // When filters change:
 *   pagination.resetToFirst();
 *
 *   // Render:
 *   <Pagination
 *     page={pagination.page}
 *     pages={pagination.pages}
 *     total={pagination.total}
 *     limit={pagination.limit}
 *     onPageChange={pagination.setPage}
 *     onLimitChange={pagination.setLimit}
 *   />
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface PaginationMeta {
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
}

export interface UsePaginationOptions {
  /** Initial page (defaults to 1). */
  initialPage?: number;
  /** Initial page size (defaults to 25 to match backend default). */
  defaultLimit?: number;
  /** Allowed page sizes for the limit selector. */
  pageSizeOptions?: number[];
  /**
   * Persist `page`/`limit` in the URL query string. Defaults to false to
   * avoid surprising existing pages — opt-in per-page.
   */
  syncToUrl?: boolean;
}

export interface UsePaginationResult {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  pageSizeOptions: number[];
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  /**
   * Apply server-returned meta. Clamps the local page to the server's
   * `pages` if the dataset shrank below the current page.
   */
  applyMeta: (meta?: PaginationMeta | null) => void;
  /**
   * Call after deleting a record. If the deleted record was the last
   * one on the current page (and the current page is not page 1), this
   * automatically steps back to the previous page so the user never
   * lands on an empty page.
   *
   * @param visibleBefore — how many items were on the current page
   *                        BEFORE the delete fired. Pass `state.data.items.length`
   *                        captured before the API call.
   */
  handleItemRemoved: (visibleBefore: number) => void;
  /** Reset to page 1 (used after a filter or search change). */
  resetToFirst: () => void;
}

const DEFAULT_PAGE_SIZES = [10, 25, 50, 100];

function readUrlNumber(name: string): number | undefined {
  if (typeof window === "undefined") return undefined;
  const v = new URLSearchParams(window.location.search).get(name);
  if (!v) return undefined;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function writeUrl(page: number, limit: number): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  params.set("page", String(page));
  params.set("limit", String(limit));
  const next = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", next);
}

export function usePagination(options: UsePaginationOptions = {}): UsePaginationResult {
  const {
    initialPage = 1,
    defaultLimit = 25,
    pageSizeOptions = DEFAULT_PAGE_SIZES,
    syncToUrl = false,
  } = options;

  const [page, setPageState] = useState<number>(() => {
    if (syncToUrl) return readUrlNumber("page") ?? initialPage;
    return initialPage;
  });
  const [limit, setLimitState] = useState<number>(() => {
    if (syncToUrl) return readUrlNumber("limit") ?? defaultLimit;
    return defaultLimit;
  });

  // Latest server-reported meta. Kept in a ref so applyMeta doesn't trigger
  // stale-closure issues in delete handlers, but mirrored to state so the
  // UI stays reactive.
  const [meta, setMeta] = useState<{ total: number; pages: number }>({
    total: 0,
    pages: 1,
  });
  const metaRef = useRef(meta);
  metaRef.current = meta;

  const setPage = useCallback(
    (next: number) => {
      const safe = Math.max(1, Math.floor(next));
      setPageState(safe);
      if (syncToUrl) writeUrl(safe, limit);
    },
    [limit, syncToUrl]
  );

  const setLimit = useCallback(
    (next: number) => {
      const safe = Math.max(1, Math.floor(next));
      setLimitState(safe);
      // Always reset to page 1 when the page size changes — otherwise the
      // user could end up on an out-of-range page.
      setPageState(1);
      if (syncToUrl) writeUrl(1, safe);
    },
    [syncToUrl]
  );

  const applyMeta = useCallback((next?: PaginationMeta | null) => {
    if (!next) return;
    const total = Math.max(0, next.total ?? 0);
    const pages = Math.max(1, next.pages ?? Math.ceil(total / Math.max(1, next.limit ?? 1)));
    setMeta({ total, pages });

    // Clamp current page if the dataset shrank.
    setPageState((cur) => (cur > pages ? pages : cur));
  }, []);

  const handleItemRemoved = useCallback(
    (visibleBefore: number) => {
      // If the deleted record was the only item on the current page (and
      // we're not on page 1), step back. The next refetch's applyMeta will
      // also catch this, but doing it eagerly avoids the flash of empty.
      if (visibleBefore <= 1 && page > 1) {
        setPageState(page - 1);
        if (syncToUrl) writeUrl(page - 1, limit);
      }
    },
    [page, limit, syncToUrl]
  );

  const resetToFirst = useCallback(() => {
    setPageState(1);
    if (syncToUrl) writeUrl(1, limit);
  }, [limit, syncToUrl]);

  // Keep URL in sync if the user navigates back/forward.
  useEffect(() => {
    if (!syncToUrl) return;
    function onPop() {
      const p = readUrlNumber("page") ?? initialPage;
      const l = readUrlNumber("limit") ?? defaultLimit;
      setPageState(p);
      setLimitState(l);
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [syncToUrl, initialPage, defaultLimit]);

  const result = useMemo<UsePaginationResult>(
    () => ({
      page,
      limit,
      total: meta.total,
      pages: meta.pages,
      hasPrevPage: page > 1,
      hasNextPage: page < meta.pages,
      pageSizeOptions,
      setPage,
      setLimit,
      applyMeta,
      handleItemRemoved,
      resetToFirst,
    }),
    [
      page,
      limit,
      meta.total,
      meta.pages,
      pageSizeOptions,
      setPage,
      setLimit,
      applyMeta,
      handleItemRemoved,
      resetToFirst,
    ]
  );

  return result;
}

/**
 * Helper to extract `{ items, meta }` from any of the response shapes
 * the various module hooks return today:
 *
 *   - `T[]`                                   (un-paginated array)
 *   - `{ items: T[], total, page, limit, pages }`  (canonical)
 *   - `{ data: T[], meta: { total, page, limit, pages } }`  (some modules)
 */
export function extractPaginated<T>(raw: unknown): {
  items: T[];
  meta: PaginationMeta;
} {
  if (Array.isArray(raw)) {
    return { items: raw as T[], meta: { total: raw.length, page: 1, pages: 1, limit: raw.length || 1 } };
  }
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    if (Array.isArray(r.items)) {
      return {
        items: r.items as T[],
        meta: {
          total: typeof r.total === "number" ? r.total : (r.items as unknown[]).length,
          page: typeof r.page === "number" ? r.page : 1,
          limit: typeof r.limit === "number" ? r.limit : (r.items as unknown[]).length,
          pages: typeof r.pages === "number" ? r.pages : 1,
        },
      };
    }
    if (Array.isArray(r.data)) {
      const m = (r.meta as Record<string, number> | undefined) ?? {};
      return {
        items: r.data as T[],
        meta: {
          total: typeof m.total === "number" ? m.total : (r.data as unknown[]).length,
          page: typeof m.page === "number" ? m.page : 1,
          limit: typeof m.limit === "number" ? m.limit : (r.data as unknown[]).length,
          pages: typeof m.pages === "number" ? m.pages : 1,
        },
      };
    }
  }
  return { items: [], meta: { total: 0, page: 1, pages: 1, limit: 0 } };
}
