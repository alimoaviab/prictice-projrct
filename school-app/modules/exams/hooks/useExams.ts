"use client";

import { useCallback, useEffect } from "react";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { showToast } from "../../../utils/toast";
import { ExamFormInput, ExamRow } from "../types/exam.types";
import * as service from "../services/exam.service";

export function useExams() {
  const { state, run } = useSafeAsync<ExamRow[]>();

  const loadExams = useCallback(() => {
    return run(async () => {
      const result = await service.listExams();
      if (!result.ok) {
        throw new Error(result.error.message || "Failed to load exams");
      }

      return result.data;
    });
  }, [run]);

  const addExam = useCallback(
    async (input: ExamFormInput) => {
      const result = await service.createExam(input);
      if (!result.ok) {
        showToast(result.error.message || "Failed to create exam", "error");
        return result;
      }

      showToast("Exam scheduled.", "success");
      await loadExams();
      return result;
    },
    [loadExams]
  );

  useEffect(() => {
    void loadExams().catch(() => {
      // Error state is already managed by useSafeAsync.
    });
  }, [loadExams]);

  return { state, addExam };
}