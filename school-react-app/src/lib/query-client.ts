/**
 * TanStack Query client with production-optimized defaults.
 *
 * Global defaults:
 *   - staleTime: 5 min — data is considered fresh for 5 minutes
 *   - gcTime: 30 min — unused cache entries are garbage collected after 30 min
 *   - refetchOnWindowFocus: false — prevents unnecessary refetches on tab switch
 *   - retry: 1 — one retry on failure (not aggressive)
 *
 * Per-module overrides (use in individual hooks):
 *   - Timetable: staleTime 2 hours (rarely changes)
 *   - Notifications: staleTime 2 min (needs freshness)
 *   - Dashboard: staleTime 5 min (default is fine)
 *   - Students: staleTime 10 min (moderate change frequency)
 */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes. During this window,
      // component mounts won't trigger refetches — they use cached data.
      staleTime: 5 * 60 * 1000,

      // Unused cache entries are garbage collected after 30 minutes.
      // This keeps memory bounded while allowing back-navigation to
      // show cached data without a loading state.
      gcTime: 30 * 60 * 1000,

      // Don't refetch when the user switches back to the tab.
      // Our staleTime handles freshness; window focus refetches cause
      // unnecessary API calls and UI flicker.
      refetchOnWindowFocus: false,

      // Don't refetch on mount if data is still fresh (within staleTime).
      refetchOnMount: true,

      // Always refetch when network reconnects (user was offline).
      refetchOnReconnect: "always",

      // One retry on failure. More than that delays error display.
      retry: 1,

      // Retry delay: exponential backoff (1s, 2s)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    },
    mutations: {
      // One retry for mutations (network glitches)
      retry: 1,
    },
  },
});

// ─── Per-Module staleTime Constants ──────────────────────────────────────
// Import these in your module hooks for consistent cache behavior.

/** Timetable: 2 hours — schedule rarely changes during the day */
export const STALE_TIME_TIMETABLE = 2 * 60 * 60 * 1000;

/** Notifications: 2 minutes — user expects near-real-time */
export const STALE_TIME_NOTIFICATIONS = 2 * 60 * 1000;

/** Dashboard: 5 minutes — aggregated stats, moderate freshness */
export const STALE_TIME_DASHBOARD = 5 * 60 * 1000;

/** Students: 10 minutes — list doesn't change frequently */
export const STALE_TIME_STUDENTS = 10 * 60 * 1000;

/** Settings: 30 minutes — almost never changes */
export const STALE_TIME_SETTINGS = 30 * 60 * 1000;

/** Classes: 30 minutes — rarely changes within a session */
export const STALE_TIME_CLASSES = 30 * 60 * 1000;

/** Attendance: 5 minutes — changes during marking hours */
export const STALE_TIME_ATTENDANCE = 5 * 60 * 1000;

/** Fees: 15 minutes — changes on payment */
export const STALE_TIME_FEES = 15 * 60 * 1000;

// ─── Tenant-scoped Query Keys ────────────────────────────────────────────

/**
 * Build a query key prefix scoped to the active tenant (school_id) and
 * academic year. Use this to compose query keys so that tenant or year
 * switches automatically miss cached results from the previous context.
 */
export function tenantQueryKey(parts: unknown[]): unknown[] {
  if (typeof window === "undefined") return parts;
  const schoolId = localStorage.getItem("last_school_id") || "anon";
  const academicYearId = localStorage.getItem("academic_year_id") || "all";
  return [`tenant:${schoolId}`, `ay:${academicYearId}`, ...parts];
}

/**
 * Clear all cached queries. Call on logout or tenant switch.
 */
export function resetTenantCache() {
  try {
    queryClient.cancelQueries();
    queryClient.clear();
  } catch {
    /* noop */
  }
}

// Expose for debugging in dev tools
if (typeof window !== "undefined") {
  (window as unknown as { queryClient: QueryClient }).queryClient = queryClient;
}
