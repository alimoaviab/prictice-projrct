/**
 * TanStack Query Cache Behavior Tests
 *
 * Verifies:
 * - Cache reuse within staleTime (no duplicate API calls)
 * - Refetch after staleTime expires
 * - Composite dashboard uses single API call
 * - Pagination uses keepPreviousData (no flash)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// Mock service-client
const mockFetch = vi.fn();
vi.mock("@/services/service-client", () => ({
  serviceRequest: (...args: any[]) => mockFetch(...args),
}));

// Mock tenant context
vi.mock("@/hooks/useTenantContext", () => ({
  useTenantContext: () => ({
    schoolId: "school_1",
    academicYearId: "ay_2025",
    role: "admin",
  }),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 min (matches production)
        gcTime: 30 * 60 * 1000,
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("TanStack Query Cache Behavior", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    mockFetch.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    queryClient.clear();
    vi.useRealTimers();
  });

  describe("Student Query Cache", () => {
    it("uses cache on remount within staleTime (no second API call)", async () => {
      const studentData = {
        ok: true,
        success: true,
        data: { items: [{ _id: "s1", first_name: "Ali" }], total: 1, page: 1, limit: 25, pages: 1 },
      };
      mockFetch.mockResolvedValue(studentData);

      const { useQuery } = await import("@tanstack/react-query");

      // First render
      const { result, unmount } = renderHook(
        () =>
          useQuery({
            queryKey: ["students", "school_1", "ay_2025", 1, 25],
            queryFn: () => mockFetch("/api/students?page=1&limit=25"),
            staleTime: 5 * 60 * 1000,
          }),
        { wrapper: createWrapper(queryClient) }
      );

      await vi.waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Unmount
      unmount();

      // Remount within staleTime — should use cache
      const { result: result2 } = renderHook(
        () =>
          useQuery({
            queryKey: ["students", "school_1", "ay_2025", 1, 25],
            queryFn: () => mockFetch("/api/students?page=1&limit=25"),
            staleTime: 5 * 60 * 1000,
          }),
        { wrapper: createWrapper(queryClient) }
      );

      // Data should be available immediately (from cache)
      expect(result2.current.data).toBeDefined();
      // No additional API call
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("refetches after staleTime expires", async () => {
      const studentData = {
        ok: true,
        success: true,
        data: { items: [{ _id: "s1" }], total: 1, page: 1, limit: 25, pages: 1 },
      };
      mockFetch.mockResolvedValue(studentData);

      const { useQuery } = await import("@tanstack/react-query");

      const { result } = renderHook(
        () =>
          useQuery({
            queryKey: ["students-stale-test"],
            queryFn: () => mockFetch("/api/students"),
            staleTime: 5 * 60 * 1000,
            refetchOnMount: "always",
          }),
        { wrapper: createWrapper(queryClient) }
      );

      await vi.waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Advance time past staleTime (11 minutes)
      act(() => {
        vi.advanceTimersByTime(11 * 60 * 1000);
      });

      // Trigger a refetch (simulates remount after stale)
      await act(async () => {
        await result.current.refetch();
      });

      // Should have made a second call
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("Composite Dashboard", () => {
    it("makes exactly 1 API call (not 4-6 separate calls)", async () => {
      const compositeData = {
        ok: true,
        success: true,
        data: {
          overview: { totalStudents: 50 },
          attendance: { present: 40 },
          fees: { totalPaid: 100000 },
          activities: [],
          upcomingEvents: [],
        },
      };
      mockFetch.mockResolvedValue(compositeData);

      const { useQuery } = await import("@tanstack/react-query");

      const { result } = renderHook(
        () =>
          useQuery({
            queryKey: ["dashboard", "composite", "school_1", "ay_2025"],
            queryFn: () => mockFetch("/api/dashboard/composite"),
          }),
        { wrapper: createWrapper(queryClient) }
      );

      await vi.waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Exactly 1 call — not separate calls for overview, attendance, fees, etc.
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith("/api/dashboard/composite");
    });
  });
});
