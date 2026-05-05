"use client";

import { useCallback, useEffect } from "react";
import { serviceRequest } from "../../../services/service-client";
import { getAcademyCareQuery } from "../../../services/academy-care-context";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { showToast } from "../../../utils/toast";
import { StudentFormInput, StudentPatchInput, StudentRow } from "../types/student.types";

export function useStudents() {
  const { state, run } = useSafeAsync<StudentRow[]>();

  const loadStudents = useCallback(() => {
    return run(async () => {
      const query = getAcademyCareQuery();

      const filtered = await serviceRequest<StudentRow[]>(`/api/students${query}`);

      // If no query selected, or the filtered request errored, or it returned results,
      // just return that result (or throw on error). Otherwise retry without the filter.
      if (!query || !filtered.ok || (filtered.data ?? []).length > 0) {
        if (!filtered.ok) {
          throw new Error(filtered.error.message || "Failed to load students");
        }

        return filtered.data;
      }

      const unfiltered = await serviceRequest<StudentRow[]>("/api/students");
      if (!unfiltered.ok) {
        throw new Error(unfiltered.error.message || "Failed to load students");
      }

      return unfiltered.data;
    });
  }, [run]);

  const addStudent = useCallback(
    async (input: StudentFormInput) => {
      const result = await serviceRequest<StudentRow>("/api/students", {
        method: "POST",
        body: JSON.stringify(input)
      });

      if (!result.ok) {
        showToast(result.error.message || "Failed to create student", "error");
        return result;
      }

      showToast("Student created.", "success");
      await loadStudents();
      return result;
    },
    [loadStudents]
  );

  const updateStudent = useCallback(
    async (id: string, input: StudentPatchInput) => {
      const result = await serviceRequest<StudentRow>(`/api/students/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input)
      });

      if (!result.ok) {
        showToast(result.error.message || "Failed to update student", "error");
        return result;
      }

      showToast("Student updated.", "success");
      await loadStudents();
      return result;
    },
    [loadStudents]
  );

  const deleteStudent = useCallback(
    async (id: string) => {
      const result = await serviceRequest<{ success: boolean; id: string }>(`/api/students/${id}`, {
        method: "DELETE"
      });

      if (!result.ok) {
        showToast(result.error.message || "Failed to delete student", "error");
        return result;
      }

      showToast("Student deleted.", "success");
      await loadStudents();
      return result;
    },
    [loadStudents]
  );

  useEffect(() => {
    void loadStudents().catch(() => {
      // Error state is already managed by useSafeAsync.
    });
  }, [loadStudents]);

  return { state, loadStudents, addStudent, updateStudent, deleteStudent };
}
