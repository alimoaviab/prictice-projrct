import { useCallback, useEffect } from "react";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { showToast } from "@/utils/toast";
import { TimetableFormInput, TimetableRecord } from "../types/timetable.types";
import { bindRefresh, publish } from "@/services/data-bus";
import * as service from "../services/timetable.service";

export function useTimetable(filters?: { class_id?: string; teacher_id?: string; day_of_week?: number }) {
  const { state, run } = useSafeAsync<TimetableRecord[]>();

  const filterKey = JSON.stringify(filters);

  const loadTimetable = useCallback(() => {
    return run(async () => {
      const result = await service.listTimetable(filters);
      if (!result.ok) {
        throw new Error(result.error?.message || "Failed to load timetable");
      }
      return result.data || [];
    });
  }, [run, filterKey]);

  const addTimetable = useCallback(
    async (input: TimetableFormInput) => {
      try {
        const result = await service.createTimetable(input);
        if (!result.ok) {
          return result; // Return error result without showing toast
        }
        // Don't auto-show toast, let the caller handle it
        await loadTimetable();
        publish("timetable");
        return result;
      } catch (error: any) {
        console.error("[useTimetable] Error creating timetable:", error);
        return { ok: false, error: { message: error.message || "Failed to create timetable entry" } };
      }
    },
    [loadTimetable]
  );

  const updateTimetable = useCallback(
    async (id: string, input: Partial<TimetableFormInput>) => {
      try {
        const result = await service.updateTimetable(id, input);
        if (!result.ok) {
          return result;
        }
        showToast("Timetable entry updated", "success");
        await loadTimetable();
        publish("timetable");
        return result;
      } catch (error: any) {
        console.error("[useTimetable] Error updating timetable:", error);
        return { ok: false, error: { message: error.message || "Failed to update timetable entry" } };
      }
    },
    [loadTimetable]
  );

  const deleteTimetable = useCallback(
    async (id: string) => {
      try {
        const result = await service.deleteTimetable(id);
        if (!result.ok) {
          return result;
        }
        showToast("Timetable entry deleted", "success");
        await loadTimetable();
        publish("timetable");
        return result;
      } catch (error: any) {
        console.error("[useTimetable] Error deleting timetable:", error);
        return { ok: false, error: { message: error.message || "Failed to delete timetable entry" } };
      }
    },
    [loadTimetable]
  );

  useEffect(() => {
    void loadTimetable().catch(() => { });
    // Refresh the timetable when classes/teachers/subjects change so any
    // selectors and conflict-check data stay in sync with new entities.
    const offClasses = bindRefresh("classes", loadTimetable);
    const offTeachers = bindRefresh("teachers", loadTimetable);
    const offSubjects = bindRefresh("subjects", loadTimetable);
    const offTimetable = bindRefresh("timetable", loadTimetable);
    return () => {
      offClasses();
      offTeachers();
      offSubjects();
      offTimetable();
    };
  }, [loadTimetable]);

  return { state, addTimetable, updateTimetable, deleteTimetable, refresh: loadTimetable };
}
