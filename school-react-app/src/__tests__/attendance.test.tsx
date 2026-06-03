/**
 * Optimistic UI Tests — Attendance Marking
 *
 * Verifies:
 * - Optimistic update shows immediately (before API responds)
 * - Rollback on API error
 * - Debounced batch submission (5 toggles → 1 API call)
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

// Mock toast
const mockToast = vi.fn();
vi.mock("@/utils/toast", () => ({
  showToast: (...args: any[]) => mockToast(...args),
}));

// Mock tenant context
vi.mock("@/hooks/useTenantContext", () => ({
  useTenantContext: () => ({
    schoolId: "school_1",
    academicYearId: "ay_2025",
    role: "teacher",
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  // Pre-populate attendance data in cache
  queryClient.setQueryData(["attendance", { classId: "cls_1", date: "2026-05-15" }], [
    { _id: "att_1", student_id: "stu_1", status: "present", student_name: "Ali Khan" },
    { _id: "att_2", student_id: "stu_2", status: "present", student_name: "Sara Ahmed" },
    { _id: "att_3", student_id: "stu_3", status: "present", student_name: "Zain Ali" },
    { _id: "att_4", student_id: "stu_4", status: "present", student_name: "Hira Malik" },
    { _id: "att_5", student_id: "stu_5", status: "present", student_name: "Omar Shah" },
  ]);

  return {
    queryClient,
    Wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe("Attendance Optimistic UI", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockToast.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Optimistic Update", () => {
    it("immediately updates UI before API responds", async () => {
      // API will resolve after a delay
      mockFetch.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, data: { saved: 1 } }), 1000))
      );

      const { queryClient, Wrapper } = createWrapper();
      const { useAttendanceMutation } = await import(
        "@/modules/attendance/hooks/useAttendanceMutation"
      );

      const { result } = renderHook(
        () => useAttendanceMutation({ classId: "cls_1", date: "2026-05-15" }),
        { wrapper: Wrapper }
      );

      // Toggle student 1 to absent
      act(() => {
        result.current.markAttendance({ studentId: "stu_1", status: "absent" });
      });

      // Check cache IMMEDIATELY (before API responds)
      const cached = queryClient.getQueryData(["attendance", { classId: "cls_1", date: "2026-05-15" }]) as any[];
      const student1 = cached?.find((r: any) => r.student_id === "stu_1");
      expect(student1?.status).toBe("absent"); // Optimistic!
    });

    it("rolls back on API error and shows toast", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const { queryClient, Wrapper } = createWrapper();
      const { useAttendanceMutation } = await import(
        "@/modules/attendance/hooks/useAttendanceMutation"
      );

      const { result } = renderHook(
        () => useAttendanceMutation({ classId: "cls_1", date: "2026-05-15" }),
        { wrapper: Wrapper }
      );

      // Toggle and flush immediately
      act(() => {
        result.current.markAttendance({ studentId: "stu_1", status: "absent" });
      });

      // Flush the debounce timer
      act(() => {
        vi.advanceTimersByTime(600);
      });

      await vi.waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith("Network error", "error");
      });

      const cached = queryClient.getQueryData(["attendance", { classId: "cls_1", date: "2026-05-15" }]) as any[];
      const student1 = cached?.find((r: any) => r.student_id === "stu_1");
      expect(student1?.status).toBe("present");
    });
  });

  describe("Debounced Batch", () => {
    it("batches 5 rapid toggles into 1 API call after 500ms", async () => {
      mockFetch.mockResolvedValue({ ok: true, data: { saved: 5 } });

      const { Wrapper } = createWrapper();
      const { useAttendanceMutation } = await import(
        "@/modules/attendance/hooks/useAttendanceMutation"
      );

      const { result } = renderHook(
        () => useAttendanceMutation({ classId: "cls_1", date: "2026-05-15" }),
        { wrapper: Wrapper }
      );

      // Toggle 5 students rapidly (within 400ms)
      act(() => {
        result.current.markAttendance({ studentId: "stu_1", status: "absent" });
      });
      act(() => {
        vi.advanceTimersByTime(80);
        result.current.markAttendance({ studentId: "stu_2", status: "absent" });
      });
      act(() => {
        vi.advanceTimersByTime(80);
        result.current.markAttendance({ studentId: "stu_3", status: "late" });
      });
      act(() => {
        vi.advanceTimersByTime(80);
        result.current.markAttendance({ studentId: "stu_4", status: "absent" });
      });
      act(() => {
        vi.advanceTimersByTime(80);
        result.current.markAttendance({ studentId: "stu_5", status: "absent" });
      });

      // Before 500ms debounce: no API call yet
      expect(mockFetch).not.toHaveBeenCalled();

      // Advance past debounce (500ms from last toggle)
      act(() => {
        vi.advanceTimersByTime(600);
      });

      // Should have made exactly 1 API call with all 5 changes
      await vi.waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Verify the payload contains all 5 student changes
      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body || "{}");
      expect(Object.keys(body.records || {}).length).toBe(5);
    });
  });
});
