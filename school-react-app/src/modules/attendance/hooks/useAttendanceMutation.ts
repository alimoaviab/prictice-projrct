/**
 * useAttendanceMutation — optimistic attendance marking with TanStack Query.
 *
 * Implements the optimistic update pattern:
 *   1. onMutate: Immediately update the UI (toggle status) before the API responds
 *   2. onError: Rollback to previous state + show error toast
 *   3. onSettled: Refetch to sync with server (source of truth)
 *
 * This gives the teacher instant feedback when toggling attendance status,
 * while ensuring data consistency with the backend.
 *
 * Usage:
 * ```tsx
 * const { markAttendance, isSaving } = useAttendanceMutation({
 *   classId: "class_10a",
 *   date: "2026-05-15",
 * });
 *
 * // Toggle a student's status
 * markAttendance({ studentId: "stu_001", status: "present" });
 * ```
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import { serviceRequest } from "@/services/service-client";
import { showToast } from "@/utils/toast";
import { useDebounce } from "@/hooks/useDebounce";
import { useTenantContext } from "@/hooks/useTenantContext";
import { isValidAttendanceTransition } from "../utils/attendance-validation";

// ─── Types ───────────────────────────────────────────────────────────────

interface AttendanceRecord {
  _id: string;
  student_id: string;
  class_id: string;
  status: string; // "present" | "absent" | "late" | "excused"
  student_name: string;
  admission_no: string;
  date: string;
  [key: string]: unknown;
}

interface MarkInput {
  studentId: string;
  status: string;
}

interface BulkMarkPayload {
  class_id: string;
  date: string;
  records: Record<string, string>; // student_id → status
  remarks?: Record<string, string>;
}

interface UseAttendanceMutationOptions {
  classId: string;
  date: string;
  period?: number;
  academicYearId?: string;
}

// ─── Query key for attendance data ───────────────────────────────────────

function attendanceQueryKey(classId: string, date: string) {
  return ["attendance", { classId, date }];
}

// ─── Hook ────────────────────────────────────────────────────────────────

export function useAttendanceMutation(opts: UseAttendanceMutationOptions) {
  const queryClient = useQueryClient();
  const { academicYearId } = useTenantContext();
  const queryKey = attendanceQueryKey(opts.classId, opts.date);

  // Batch buffer: accumulates multiple toggles before sending
  const batchRef = useRef<Record<string, string>>({});

  // The actual API call — sends all batched changes at once
  const mutation = useMutation<
    { saved: number },
    Error,
    BulkMarkPayload,
    { previousData: unknown }
  >({
    mutationFn: async (payload) => {
      const result = await serviceRequest<{ saved: number }>(
        "/api/attendance/mark",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
      if (!result.ok) {
        throw new Error(result.error?.message || "Failed to save attendance");
      }
      return result.data!;
    },

    // ─── Optimistic Update ─────────────────────────────────────────────
    onMutate: async (payload) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value for rollback
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update the cached attendance records
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;

        // Handle both array and paginated response shapes
        const records: AttendanceRecord[] = Array.isArray(old)
          ? old
          : old?.data ?? old?.items ?? [];

        const updated = records.map((record: AttendanceRecord) => {
          const newStatus = payload.records[record.student_id];
          if (newStatus) {
            return { ...record, status: newStatus };
          }
          return record;
        });

        // Return in the same shape as the original
        if (Array.isArray(old)) return updated;
        if (old?.data) return { ...old, data: updated };
        if (old?.items) return { ...old, items: updated };
        return updated;
      });

      return { previousData };
    },

    // ─── Rollback on Error ─────────────────────────────────────────────
    onError: (error, _payload, context) => {
      // Restore the previous cache state
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }

      showToast(
        error.message || "Failed to save attendance. Please try again.",
        "error"
      );
    },

    // ─── Sync with Server ──────────────────────────────────────────────
    onSettled: () => {
      // Always refetch after mutation to ensure we're in sync with the server.
      // This handles edge cases where the optimistic update was slightly wrong
      // (e.g., another teacher marked the same class simultaneously).
      queryClient.invalidateQueries({ queryKey });

      // Invalidate ALL attendance queries (other dates, classes, etc.)
      // to ensure cross-portal consistency
      queryClient.invalidateQueries({ queryKey: ["attendance"] });

      // Invalidate parent attendance queries
      queryClient.invalidateQueries({ queryKey: ["parent-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["parent-student-attendance"] });

      // Invalidate dashboard and summary stats
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-summary"] });
    },

    onSuccess: (data) => {
      showToast(`Attendance saved (${data.saved} students)`, "success");
    },
  });

  // ─── Debounced batch submit (500ms) ──────────────────────────────────
  // Multiple rapid toggles are batched into a single API call.
  const flushBatch = useDebounce(() => {
    const records = { ...batchRef.current };
    if (Object.keys(records).length === 0) return;

    // Clear the batch
    batchRef.current = {};

    // Submit
    mutation.mutate({
      class_id: opts.classId,
      date: opts.date,
      records,
      ...(opts.academicYearId || academicYearId
        ? { academic_year_id: opts.academicYearId || academicYearId }
        : {}),
    });
  }, 500);

  // ─── Public API ──────────────────────────────────────────────────────

  /**
   * Mark a single student's attendance. Multiple calls within 500ms are
   * batched into a single API request.
   *
   * The UI updates immediately (optimistic) — the batch is sent after
   * 500ms of inactivity.
   */
  const markAttendance = useCallback(
    (input: MarkInput) => {
      // Get current cached records to validate state transition
      const cachedData = queryClient.getQueryData<any>(queryKey);
      const records: AttendanceRecord[] = Array.isArray(cachedData)
        ? cachedData
        : cachedData?.data ?? cachedData?.items ?? [];

      // Find current status for this student
      const currentRecord = records.find((r) => r.student_id === input.studentId);
      const currentStatus = (currentRecord?.status || "unmarked") as any;

      // Validate state transition (prevent PRESENT/ABSENT → UNMARKED)
      if (!isValidAttendanceTransition(currentStatus, input.status as any)) {
        showToast(
          `Cannot change from ${currentStatus} to ${input.status}. Once marked, attendance cannot be reverted to unmarked.`,
          "warning"
        );
        return;
      }

      // Add to batch
      batchRef.current[input.studentId] = input.status;

      // Optimistically update the UI immediately (don't wait for batch)
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;

        const records: AttendanceRecord[] = Array.isArray(old)
          ? old
          : old?.data ?? old?.items ?? [];

        const updated = records.map((record: AttendanceRecord) => {
          if (record.student_id === input.studentId) {
            return { ...record, status: input.status };
          }
          return record;
        });

        if (Array.isArray(old)) return updated;
        if (old?.data) return { ...old, data: updated };
        if (old?.items) return { ...old, items: updated };
        return updated;
      });

      // Schedule the batch submit (resets the 500ms timer on each call)
      flushBatch();
    },
    [queryKey, queryClient, flushBatch]
  );

  /**
   * Submit all pending changes immediately (e.g., on "Save" button click).
   */
  const submitNow = useCallback(() => {
    flushBatch.flush();
  }, [flushBatch]);

  /**
   * Cancel all pending changes and revert to server state.
   */
  const cancelPending = useCallback(() => {
    flushBatch.cancel();
    batchRef.current = {};
    queryClient.invalidateQueries({ queryKey });
  }, [flushBatch, queryClient, queryKey]);

  return {
    markAttendance,
    submitNow,
    cancelPending,
    isSaving: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    hasPendingChanges: () => Object.keys(batchRef.current).length > 0,
  };
}
