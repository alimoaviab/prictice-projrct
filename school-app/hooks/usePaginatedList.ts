"use client";

import { useState, useCallback } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { serviceRequest } from "../services/service-client";
import { useTenantContext } from "./useTenantContext";
import { useDebouncedValue } from "./useDebouncedValue";

export type Paginated<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
    pages: number;
};

export type PaginatedListState<T> = {
    /** Current rows for the active page */
    items: T[];
    total: number;
    page: number;
    limit: number;
    pages: number;
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    error: unknown;
    /** Bound search string the user is currently typing (raw, not debounced) */
    search: string;
    setSearch: (value: string) => void;
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    setFilters: (filters: Record<string, string | number | undefined>) => void;
    refetch: () => void;
    raw: Paginated<T> | undefined;
};

/**
 * Reusable paginated-list hook backed by React Query.
 *
 * Designed to drop into any list page in 3 lines:
 *   const list = usePaginatedList<Student>({ url: '/api/students', resource: 'students' });
 *
 * Features (no behavior changes to APIs):
 *   - Server-side pagination (sends ?page=N&limit=L automatically).
 *   - Debounced server-side search (?search=...).
 *   - Tenant-aware cache keys: school_id + academic_year_id + role + filters.
 *   - keepPreviousData for smooth page transitions.
 *   - Filter object is passed straight through as query params.
 */
export function usePaginatedList<T = any>(opts: {
    url: string;
    resource: string;
    initialPage?: number;
    initialLimit?: number;
    initialFilters?: Record<string, string | number | undefined>;
    /** Override staleTime in ms (default 30 s) */
    staleTime?: number;
    enabled?: boolean;
    /** Extra search params that the API expects on every request */
    extraParams?: Record<string, string | number | undefined>;
}): PaginatedListState<T> {
    const { schoolId, academicYearId, role } = useTenantContext();

    const [page, setPage] = useState<number>(opts.initialPage ?? 1);
    const [limit, setLimit] = useState<number>(opts.initialLimit ?? 25);
    const [search, setSearchInternal] = useState<string>("");
    const [filters, setFiltersInternal] = useState<Record<string, string | number | undefined>>(
        opts.initialFilters ?? {}
    );

    const debouncedSearch = useDebouncedValue(search, 300);

    const setSearch = useCallback((value: string) => {
        setSearchInternal(value);
        setPage(1);
    }, []);

    const setFilters = useCallback((next: Record<string, string | number | undefined>) => {
        setFiltersInternal(next);
        setPage(1);
    }, []);

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (academicYearId) params.set("academic_year_id", academicYearId);
    Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
    });
    Object.entries(opts.extraParams ?? {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
    });

    const fullUrl = `${opts.url}?${params.toString()}`;

    const query = useQuery({
        queryKey: [
            opts.resource,
            schoolId,
            academicYearId,
            role,
            page,
            limit,
            debouncedSearch,
            filters,
            opts.extraParams ?? null
        ],
        queryFn: async () => {
            const result = await serviceRequest<Paginated<T> | T[]>(fullUrl);
            if (!result.ok) throw new Error(result.error?.message || `Failed to load ${opts.resource}`);

            const data = result.data;
            // Some endpoints still return a plain array. Normalize to Paginated<T>.
            if (Array.isArray(data)) {
                const sliced = data.slice((page - 1) * limit, page * limit);
                return {
                    items: sliced as T[],
                    total: data.length,
                    page,
                    limit,
                    pages: Math.max(1, Math.ceil(data.length / limit))
                } as Paginated<T>;
            }
            return data as Paginated<T>;
        },
        placeholderData: keepPreviousData,
        staleTime: opts.staleTime ?? 30 * 1000,
        gcTime: 5 * 60 * 1000,
        enabled: (opts.enabled ?? true) && !!schoolId
    });

    const data = query.data;

    return {
        items: data?.items ?? [],
        total: data?.total ?? 0,
        page: data?.page ?? page,
        limit: data?.limit ?? limit,
        pages: data?.pages ?? 1,
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        isError: query.isError,
        error: query.error,
        search,
        setSearch,
        setPage,
        setLimit,
        setFilters,
        refetch: () => void query.refetch(),
        raw: data
    };
}
