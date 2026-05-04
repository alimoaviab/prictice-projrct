"use client";

import { useCallback, useEffect } from "react";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { showToast } from "../../../utils/toast";
import { HomeworkFormInput, HomeworkRecordRow } from "../types/homework.types";
import * as service from "../services/homework.service";

export function useHomework(filters?: { class_id?: string; teacher_id?: string }) {
  const { state, run } = useSafeAsync<HomeworkRecordRow[]>();

  const filterKey = JSON.stringify(filters);

  const loadHomework = useCallback(() => {
    return run(async () => {
      const result = await service.listHomework(filters);
      if (!result.ok) {
        throw new Error(result.error.message || "Failed to load homework");
      }
      return result.data;
    });
  }, [run, filterKey]);

  const addHomework = useCallback(
    async (input: HomeworkFormInput) => {
      const result = await service.createHomework(input);
      if (!result.ok) {
        showToast(result.error.message || "Failed to create homework", "error");
        return result;
      }

      showToast("Homework assigned.", "success");
      await loadHomework();
      return result;
    },
    [loadHomework]
  );

  const updateHomework = useCallback(
    async (id: string, input: Partial<HomeworkFormInput>) => {
      const result = await service.updateHomework(id, input);
      if (!result.ok) {
        showToast(result.error.message || "Failed to update homework", "error");
        return result;
      }

      showToast("Homework updated.", "success");
      await loadHomework();
      return result;
    },
    [loadHomework]
  );

  const deleteHomework = useCallback(
    async (id: string) => {
      const result = await service.deleteHomework(id);
      if (!result.ok) {
        showToast(result.error.message || "Failed to delete homework", "error");
        return result;
      }

      showToast("Homework deleted.", "success");
      await loadHomework();
      return result;
    },
    [loadHomework]
  );

  useEffect(() => {
    void loadHomework().catch(() => {
      // Error state is already managed by useSafeAsync.
    });
  }, [loadHomework]);

  return { state, addHomework, updateHomework, deleteHomework };
}
