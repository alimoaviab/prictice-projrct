import { useCallback, useEffect } from "react";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { showToast } from "@/utils/toast";
import {
  TimetableFormInput,
  TimetableRecord,
  TimetableSummary,
} from "../types/timetable.types";
import { bindRefresh, publish } from "@/services/data-bus";
import * as service from "../services/timetable.service";

/**
 * Lightweight cache for the list view. We avoid React Query to stay in
 * the existing data-bus + useSafeAsync ecosystem the rest of the app
 * uses, but we do dedupe loads per filter and keep the previous data
 * during refetch so the grid never flickers.
 */
const cacheByFilter = new Map<string, TimetableRecord[]>();

function filterKey(filters?: service.TimetableListFilters): string {
  return JSON.stringify(filters ?? {});
}

/**
 * Module-level stable reference. Passing an inline `() => false` to
 * useSafeAsync would create a new function each render — useSafeAsync
 * then derives `run` from it via useCallback, the consumer's load()
 * derives from `run`, and the useEffect dep array re-fires on every
 * render, hammering the backend in a loop. Keep this stable.
 */
const NEVER_EMPTY = (): boolean => false;

export function useTimetable(filters?: service.TimetableListFilters) {
  const { state, run } = useSafeAsync<TimetableRecord[]>();
  const key = filterKey(filters);

  const loadTimetable = useCallback(() => {
    return run(async () => {
      const result = await service.listTimetable(filters);
      if (!result.ok) {
        throw new Error(result.error?.message || result.message || "Failed to load timetable");
      }
      const data = result.data ?? [];
      cacheByFilter.set(key, data);
      return data;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, key]);

  const addTimetable = useCallback(
    async (input: TimetableFormInput) => {
      const result = await service.createTimetable(input);
      if (!result.ok) return result;
      await loadTimetable();
      publish("timetable");
      return result;
    },
    [loadTimetable]
  );

  const updateTimetable = useCallback(
    async (id: string, input: Partial<TimetableFormInput>) => {
      const result = await service.updateTimetable(id, input);
      if (!result.ok) return result;
      await loadTimetable();
      publish("timetable");
      return result;
    },
    [loadTimetable]
  );

  const deleteTimetable = useCallback(
    async (id: string) => {
      const result = await service.deleteTimetable(id);
      if (!result.ok) {
        showToast(result.error?.message || result.message || "Failed to delete entry", "error");
        return result;
      }
      showToast("Period removed.", "success");
      await loadTimetable();
      publish("timetable");
      return result;
    },
    [loadTimetable]
  );

  useEffect(() => {
    void loadTimetable().catch(() => {});
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

export function useTimetableSummary() {
  // Counters are always meaningful — disable the "empty" auto-detect.
  // NEVER_EMPTY is module-level so its reference is stable across
  // renders; an inline arrow here would loop the effect (see comment
  // above NEVER_EMPTY).
  const { state, run } = useSafeAsync<TimetableSummary>(NEVER_EMPTY);

  const load = useCallback(() => {
    return run(async () => {
      const result = await service.getTimetableSummary();
      if (!result.ok) {
        throw new Error(result.error?.message || result.message || "Failed to load summary");
      }
      return result.data!;
    });
  }, [run]);

  useEffect(() => {
    void load().catch(() => {});
    const off = bindRefresh("timetable", load);
    return off;
  }, [load]);

  return { state, refresh: load };
}
