"use client";

import { useCallback, useEffect } from "react";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { serviceRequest } from "../../../services/service-client";
import { showToast } from "../../../utils/toast";
import { SchoolFormInput, SchoolRow } from "../types/school.types";

export function useSchools() {
  const { state, run } = useSafeAsync<{ items: SchoolRow[]; total: number }>();

  const loadSchools = useCallback((params: { page?: number; limit?: number; search?: string; status?: string; plan?: string } = {}) => {
    return run(async () => {
      const query = new URLSearchParams();
      if (params.page) query.append("page", params.page.toString());
      if (params.limit) query.append("limit", params.limit.toString());
      if (params.search) query.append("search", params.search);
      if (params.status) query.append("status", params.status);
      if (params.plan) query.append("plan", params.plan);

      const result = await serviceRequest<{ items: SchoolRow[]; total: number }>(`/api/schools?${query.toString()}`);
      if (!result.ok) {
        throw new Error(result.error.message);
      }

      return result.data;
    });
  }, [run]);

  const create = useCallback(
    async (input: SchoolFormInput) => {
      const result = await serviceRequest<SchoolRow>("/api/schools", {
        method: "POST",
        body: JSON.stringify(input)
      });

      if (!result.ok) {
        showToast(result.error.message, "error");
        return result;
      }

      showToast("School created.", "success");
      await loadSchools();
      return result;
    },
    [loadSchools]
  );

  const updateStatus = useCallback(
    async (schoolId: string, status: string, reason?: string) => {
      const result = await serviceRequest<SchoolRow>(`/api/schools/${schoolId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, reason })
      });

      if (!result.ok) {
        showToast(result.error.message, "error");
        return result;
      }

      showToast(`School status updated to ${status}.`, "success");
      await loadSchools();
      return result;
    },
    [loadSchools]
  );

  useEffect(() => {
    void loadSchools();
  }, [loadSchools]);

  return { state, create, updateStatus, loadSchools };
}
