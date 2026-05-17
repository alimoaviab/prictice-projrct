import { useCallback, useEffect } from "react";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { showToast } from "@/utils/toast";
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

      // Handle parent portal nested structure
      if (result.data && !Array.isArray(result.data) && (result.data as any).exam_results) {
          return (result.data as any).exam_results;
      }

      return result.data;
    });
  }, [run, filterKey]);

  const addResult = useCallback(
    async (input: ResultFormInput) => {
      const result = await service.saveResult(input);
      if (!result.ok) {
        showToast(result.error.message || "Could not save result. Please check the marks and try again.", "error");
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
        showToast(result.error.message || "Could not update result. Please check your changes and try again.", "error");
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
        showToast(result.error.message || "Could not delete result. Please try again.", "error");
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

export function useResult(id: string | undefined) {
  const { state, run } = useSafeAsync<ResultRow>();

  const loadResult = useCallback(() => {
    if (!id) return;
    return run(async () => {
      const result = await service.getResult(id);
      if (!result.ok) {
        throw new Error(result.error.message || "Failed to load result");
      }
      return result.data;
    });
  }, [id, run]);

  useEffect(() => {
    void loadResult();
  }, [loadResult]);

  return { state, refresh: loadResult };
}