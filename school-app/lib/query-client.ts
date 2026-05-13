import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep server state fresh for 60s by default. Lists that need stricter
      // freshness override per-hook (usePaginatedList = 30s).
      staleTime: 60 * 1000,
      // Keep unused data in cache for 10 minutes for instant nav back.
      gcTime: 10 * 60 * 1000,
      // Retry failed requests once
      retry: 1,
      // Don't refetch on window focus by default; would cause extra round trips.
      refetchOnWindowFocus: false,
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
      refetchOnReconnect: "always"
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

/**
 * CRITICAL: Build a query key prefix that is scoped to the active tenant
 * (school_id) and academic year. Use this to compose query keys so that
 * tenant or year switches automatically miss cached results from the
 * previous context.
 *
 * Usage:
 *   useQuery({ queryKey: tenantQueryKey(["students", filters]), queryFn })
 */
export function tenantQueryKey(parts: unknown[]): unknown[] {
  if (typeof window === "undefined") return parts;
  const schoolId = localStorage.getItem("last_school_id") || "anon";
  const academicYearId = localStorage.getItem("academic_year_id") || "all";
  return [`tenant:${schoolId}`, `ay:${academicYearId}`, ...parts];
}

/**
 * Reset all cached queries — call this from logout flow and after a
 * cross-tenant or cross-year boundary is detected.
 */
export function resetTenantCache() {
  try {
    queryClient.cancelQueries();
    queryClient.clear();
  } catch {
    /* noop */
  }
}

if (typeof window !== "undefined") {
  // Expose for legacy auth-cache helpers that look up window.queryClient
  (window as any).queryClient = queryClient;
}
