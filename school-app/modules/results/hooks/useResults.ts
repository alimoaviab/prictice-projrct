"use client";

import { useCallback, useEffect } from "react";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { showToast } from "../../../utils/toast";
import { ResultFormInput, ResultRow } from "../types/result.types";
import * as service from "../services/result.service";

export function useResults() {
  const { state, run } = useSafeAsync<ResultRow[]>();

  const loadResults = useCallback(() => {
    return run(async () => {
      const result = await service.listResults();
      if (!result.ok) {
        throw new Error(result.error.message || "Failed to load results");
      }

      return result.data;
    });
  }, [run]);

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

  useEffect(() => {
    void loadResults().catch(() => {
      // Error state is already managed by useSafeAsync.
    });
  }, [loadResults]);

  return { state, addResult };
}