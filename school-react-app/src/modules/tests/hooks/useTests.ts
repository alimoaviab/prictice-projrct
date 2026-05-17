import { useCallback, useEffect } from "react";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { showToast } from "@/utils/toast";
import { TestFormInput, TestRow } from "../types/test.types";
import { bindRefresh, publish } from "@/services/data-bus";
import * as service from "../services/test.service";

export function useTests(filters?: { class_id?: string; subject?: string }) {
  const { state, run } = useSafeAsync<TestRow[]>();

  const filterKey = JSON.stringify(filters);

  const loadTests = useCallback(() => {
    return run(async () => {
      const result = await service.listTests(filters);
      if (!result.ok) {
        throw new Error(result.error.message || "Failed to load tests");
      }

      return result.data;
    });
  }, [run, filterKey]);

  const addTest = useCallback(
    async (input: TestFormInput) => {
      const result = await service.createTest(input);
      if (!result.ok) {
        showToast(result.error.message || "Could not create test. Please check the details and try again.", "error");
        return result;
      }

      showToast("Test scheduled.", "success");
      await loadTests();
      publish("tests");
      return result;
    },
    [loadTests]
  );

  const updateTest = useCallback(
    async (id: string, input: Partial<TestFormInput>) => {
      const result = await service.updateTest(id, input);
      if (!result.ok) {
        showToast(result.error.message || "Could not update test. Please check your changes and try again.", "error");
        return result;
      }

      showToast("Test updated.", "success");
      await loadTests();
      publish("tests");
      return result;
    },
    [loadTests]
  );

  const deleteTest = useCallback(
    async (id: string) => {
      const result = await service.deleteTest(id);
      if (!result.ok) {
        showToast(result.error.message || "Could not delete test. It may have results linked to it.", "error");
        return result;
      }

      showToast("Test deleted.", "success");
      await loadTests();
      publish("tests");
      return result;
    },
    [loadTests]
  );

  useEffect(() => {
    void loadTests().catch(() => {
      // Error state is already managed by useSafeAsync.
    });
    const offClasses = bindRefresh("classes", loadTests);
    const offTests = bindRefresh("tests", loadTests);
    return () => {
      offClasses();
      offTests();
    };
  }, [loadTests]);

  return { state, addTest, updateTest, deleteTest };
}