"use client";

import { useCallback, useEffect } from "react";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { showToast } from "../../../utils/toast";
import { HomeworkFormInput, HomeworkRecordRow } from "../types/homework.types";
import * as service from "../services/homework.service";

export function useHomework() {
  const { state, run } = useSafeAsync<HomeworkRecordRow[]>();

  const loadHomework = useCallback(() => {
    return run(async () => {
      const result = await service.listHomework();
      if (!result.ok) {
        throw new Error(result.error.message || "Failed to load homework");
      }
      return result.data;
    });
  }, [run]);

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

  useEffect(() => {
    void loadHomework().catch(() => {
      // Error state is already managed by useSafeAsync.
    });
  }, [loadHomework]);

  return { state, addHomework };
}
