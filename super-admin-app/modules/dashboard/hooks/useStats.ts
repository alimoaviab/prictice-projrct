"use client";

import { useCallback, useEffect } from "react";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { serviceRequest } from "../../../services/service-client";

export function useStats() {
  const { state, run } = useSafeAsync<any>();

  const loadStats = useCallback(() => {
    return run(async () => {
      const result = await serviceRequest<any>("/api/stats");
      if (!result.ok) {
        throw new Error(result.error.message);
      }
      return result.data;
    });
  }, [run]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  return { state, loadStats };
}
