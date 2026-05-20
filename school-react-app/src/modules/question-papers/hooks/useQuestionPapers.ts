import { useCallback, useEffect } from "react";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { showToast } from "@/utils/toast";
import * as service from "../services/questionPaper.service";
import type { QuestionPaper, QuestionPaperFormInput } from "../types/questionPaper.types";

export function useQuestionPapers() {
  const { state, run } = useSafeAsync<QuestionPaper[]>();

  const load = useCallback(() => {
    return run(async () => {
      const result = await service.listQuestionPapers();
      if (!result.ok) throw new Error(result.error?.message || "Failed to load question papers");
      return result.data ?? [];
    });
  }, [run]);

  const create = useCallback(
    async (input: QuestionPaperFormInput) => {
      const result = await service.createQuestionPaper(input);
      if (!result.ok) {
        showToast(result.error?.message || "Failed to create question paper.", "error");
        return result;
      }
      showToast("Question paper created.", "success");
      await load();
      return result;
    },
    [load]
  );

  const remove = useCallback(
    async (id: string) => {
      const result = await service.deleteQuestionPaper(id);
      if (!result.ok) {
        showToast(result.error?.message || "Failed to delete.", "error");
        return result;
      }
      showToast("Question paper deleted.", "success");
      await load();
      return result;
    },
    [load]
  );

  useEffect(() => {
    void load().catch(() => {});
  }, [load]);

  return { state, create, remove, refresh: load };
}
