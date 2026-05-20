import { useCallback, useEffect, useState } from "react";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { showToast } from "@/utils/toast";
import * as service from "../services/questionBank.service";
import type { BankQuestion, CreateQuestionInput, QuestionFilters } from "../types/questionBank.types";

export function useQuestionBank(filters?: QuestionFilters) {
  const { state, run } = useSafeAsync<BankQuestion[]>();
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    return run(async () => {
      const result = await service.listQuestions(filters);
      if (!result.ok) throw new Error(result.error?.message || "Failed to load questions");
      return result.data ?? [];
    });
  }, [run, JSON.stringify(filters)]);

  const loadStarred = useCallback(async () => {
    const result = await service.getStarredIds();
    if (result.ok && result.data) {
      setStarredIds(new Set(result.data));
    }
  }, []);

  const createQuestion = useCallback(
    async (input: CreateQuestionInput) => {
      const result = await service.createQuestion(input);
      if (!result.ok) {
        showToast(result.error?.message || "Failed to create question.", "error");
        return result;
      }
      showToast("Question added to bank.", "success");
      await load();
      return result;
    },
    [load]
  );

  const archiveQuestion = useCallback(
    async (id: string) => {
      const result = await service.archiveQuestion(id);
      if (!result.ok) {
        showToast(result.error?.message || "Failed to archive.", "error");
        return;
      }
      showToast("Question archived.", "success");
      await load();
    },
    [load]
  );

  const restoreQuestion = useCallback(
    async (id: string) => {
      const result = await service.restoreQuestion(id);
      if (!result.ok) {
        showToast(result.error?.message || "Failed to restore.", "error");
        return;
      }
      showToast("Question restored.", "success");
      await load();
    },
    [load]
  );

  const toggleStar = useCallback(
    async (id: string) => {
      const isStarred = starredIds.has(id);
      // Optimistic update
      setStarredIds((prev) => {
        const next = new Set(prev);
        if (isStarred) next.delete(id);
        else next.add(id);
        return next;
      });

      const result = isStarred
        ? await service.unstarQuestion(id)
        : await service.starQuestion(id);

      if (!result.ok) {
        // Revert on failure
        setStarredIds((prev) => {
          const next = new Set(prev);
          if (isStarred) next.add(id);
          else next.delete(id);
          return next;
        });
      }
    },
    [starredIds]
  );

  useEffect(() => {
    void load().catch(() => {});
    void loadStarred();
  }, [load, loadStarred]);

  return { state, starredIds, createQuestion, archiveQuestion, restoreQuestion, toggleStar, refresh: load };
}
