"use client";

import { useCallback, useEffect } from "react";
import { serviceRequest } from "../../../services/service-client";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { showToast } from "../../../utils/toast";
import { StudentFormInput, StudentPatchInput, StudentRow } from "../types/student.types";

export function useStudents() {
  const { state, run } = useSafeAsync<StudentRow[]>();

  const loadStudents = useCallback(() => {
    return run(async () => {
      const result = await serviceRequest<StudentRow[]>("/api/students");
      if (!result.ok) {
        throw new Error(result.error.message);
      }

      return result.data;
    });
  }, [run]);

  const addStudent = useCallback(
    async (input: StudentFormInput) => {
      const result = await serviceRequest<StudentRow>("/api/students", {
        method: "POST",
        body: JSON.stringify(input)
      });

      if (!result.ok) {
        showToast(result.error.message, "error");
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
        showToast(result.error.message, "error");
        return result;
      }

      showToast("Student updated.", "success");
      await loadStudents();
      return result;
    },
    [loadStudents]
  );

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  return { state, loadStudents, addStudent, updateStudent };
}
