import { useCallback, useEffect } from "react";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { showToast } from "@/utils/toast";
import { AttendanceFormInput, AttendanceRecordRow } from "../types/attendance.types";
import * as service from "../services/attendance.service";

export function useAttendance(filters?: { class_id?: string; student_id?: string; date?: string }) {
  const { state, run } = useSafeAsync<AttendanceRecordRow[]>();

  const filterKey = JSON.stringify(filters);

  const loadAttendance = useCallback(() => {
    return run(async () => {
      const result = await service.listAttendance(filters);
      if (!result.ok) {
        throw new Error(result.error.message || "Failed to load attendance");
      }
      // CRITICAL: Ensure we always return an array, never null/undefined
      // This prevents "unmarked" regression on page reload
      return Array.isArray(result.data) ? result.data : [];
    });
  }, [run, filterKey]);

  const addAttendance = useCallback(
    async (input: AttendanceFormInput) => {
      const result = await service.createAttendance(input);
      if (!result.ok) {
        showToast(result.error.message || "Could not record attendance. Please check the student and date selection.", "error");
        return result;
      }

      showToast("Attendance recorded.", "success");
      // Reload to persist properly across page reloads and portals
      await loadAttendance();
      return result;
    },
    [loadAttendance]
  );

  const updateAttendance = useCallback(
    async (id: string, input: Partial<AttendanceFormInput>) => {
      const result = await service.updateAttendance(id, input);
      if (!result.ok) {
        showToast(result.error.message || "Could not update attendance record. Please try again.", "error");
        return result;
      }

      showToast("Attendance updated.", "success");
      // Reload to sync across portals
      await loadAttendance();
      return result;
    },
    [loadAttendance]
  );

  const deleteAttendance = useCallback(
    async (id: string) => {
      const result = await service.deleteAttendance(id);
      if (!result.ok) {
        showToast(result.error.message || "Could not delete attendance record. Please try again.", "error");
        return result;
      }

      showToast("Attendance deleted.", "success");
      await loadAttendance();
      return result;
    },
    [loadAttendance]
  );

  useEffect(() => {
    void loadAttendance().catch(() => {
      // Error state is already managed by useSafeAsync.
    });
  }, [loadAttendance]);

  return { state, addAttendance, updateAttendance, deleteAttendance, refresh: loadAttendance };
}
