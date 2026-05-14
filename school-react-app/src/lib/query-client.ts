/**
 * Ported from old-app/school-app/lib/query-client.ts. Same defaults, same
 * `tenantQueryKey` and `resetTenantCache` helpers — module hooks rely on the
 * exact key prefix shape.
 */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: "always",
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * CRITICAL: Build a query key prefix that is scoped to the active tenant
 * (school_id) and academic year. Use this to compose query keys so that
 * tenant or year switches automatically miss cached results from the
 * previous context.
 */
export function tenantQueryKey(parts: unknown[]): unknown[] {
  if (typeof window === "undefined") return parts;
  const schoolId = localStorage.getItem("last_school_id") || "anon";
  const academicYearId = localStorage.getItem("academic_year_id") || "all";
  return [`tenant:${schoolId}`, `ay:${academicYearId}`, ...parts];
}

export function resetTenantCache() {
  try {
    queryClient.cancelQueries();
    queryClient.clear();
  } catch {
    /* noop */
  }
}

if (typeof window !== "undefined") {
  (window as unknown as { queryClient: QueryClient }).queryClient = queryClient;
}
