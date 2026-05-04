"use client";

import { useCallback, useEffect } from "react";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { showToast } from "../../../utils/toast";
import { ResultFormInput, ResultRow } from "../types/result.types";
import * as service from "../services/result.service";

export function useResults(filters?: { exam_id?: string; student_id?: string }) {
  const { state, run } = useSafeAsync<ResultRow[]>();

  const filterKey = JSON.stringify(filters);

  const loadResults = useCallback(() => {
    return run(async () => {
      const result = await service.listResults(filters);
      if (!result.ok) {
        throw new Error(result.error.message || "Failed to load results");
      }

      return result.data;
    });
  }, [run, filterKey]);

  const addResult = useCallback(
    async (input: ResultFormInput) => {
      const result = await service.saveResult(input);
      if (!result.ok) {
        showToast(result.error.message || "Failed to save result", "error");
        return result;
      }

      showToast("Result saved.", "success");
      await loadResults();
      return result;
    },
    [loadResults]
  );

  const updateResult = useCallback(
    async (id: string, input: Partial<ResultFormInput>) => {
      const result = await service.updateResult(id, input);
      if (!result.ok) {
        showToast(result.error.message || "Failed to update result", "error");
        return result;
      }

      showToast("Result updated.", "success");
      await loadResults();
      return result;
    },
    [loadResults]
  );

  const deleteResult = useCallback(
    async (id: string) => {
      const result = await service.deleteResult(id);
      if (!result.ok) {
        showToast(result.error.message || "Failed to delete result", "error");
        return result;
      }

      showToast("Result deleted.", "success");
      await loadResults();
      return result;
    },
    [loadResults]
  );

  useEffect(() => {
    void loadResults().catch(() => {
      // Error state is already managed by useSafeAsync.
    });
  }, [loadResults]);

  return { state, addResult, updateResult, deleteResult };
}