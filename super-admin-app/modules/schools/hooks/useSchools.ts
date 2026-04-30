"use client";

import { useCallback, useEffect } from "react";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { serviceRequest } from "../../../services/service-client";
import { showToast } from "../../../utils/toast";
import { SchoolFormInput, SchoolRow } from "../types/school.types";

export function useSchools() {
  const { state, run } = useSafeAsync<SchoolRow[]>();

  const loadSchools = useCallback(() => {
    return run(async () => {
      const result = await serviceRequest<SchoolRow[]>("/api/schools");
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

  const setBlocked = useCallback(
    async (schoolId: string, blocked: boolean) => {
      const result = await serviceRequest<SchoolRow>(`/api/schools/${schoolId}/block`, {
        method: "PATCH",
        body: JSON.stringify({ blocked })
      });

      if (!result.ok) {
        showToast(result.error.message, "error");
        return result;
      }

      showToast(blocked ? "School blocked." : "School unblocked.", "success");
      await loadSchools();
      return result;
    },
    [loadSchools]
  );

  useEffect(() => {
    void loadSchools();
  }, [loadSchools]);

  return { state, create, setBlocked, loadSchools };
}
