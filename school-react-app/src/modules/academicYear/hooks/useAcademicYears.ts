/**
 * Academic Year list hook — TanStack Query backed (Phase 7).
 *
 * Why this exists in this shape:
 *   The previous `useSafeAsync` implementation triggered a fresh
 *   /api/academic-years call every time a page mounted. ClassListPage,
 *   ClassPage, ClassCreatePage, ClassEditPage all use this hook, so
 *   navigating between any two of those = redundant request.
 *
 *   We now route through the global QueryClient. With staleTime=5min,
 *   subsequent mounts inside the window read the cached payload and
 *   only the **first** mount per window actually hits the network.
 *
 *   Mutations stay on the existing service layer; on success they
 *   invalidate the list query so the UI shows the latest rows
 *   without page reload.
 *
 * Public surface preserved verbatim:
 *   { state, page, setPage, addAcademicYear, updateAcademicYear,
 *     deleteAcademicYear, refresh }
 *
 *   `state` exposes the same `{ status, data, error }` shape every
 *   caller already consumes — `state.data?.data` continues to point
 *   at the row array. No call site needs to change.
 */

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/utils/toast";
import { AcademicYearRow, AcademicYearFormInput } from "../types/academicYear.types";
import * as service from "../services/academicYear.service";
import type { AsyncState } from "@/types/core";

interface ListResult {
  data: AcademicYearRow[];
  meta: { total: number; pages: number };
}

const QUERY_KEY = "academic-years";

// 5-minute window: matches the global default plus mirrors the
// project's `STALE_TIME_DASHBOARD` rhythm. Academic years rarely
// change inside an admin's session.
const ACADEMIC_YEARS_STALE_TIME = 5 * 60 * 1000;

export function useAcademicYears(initialPage = 1, limit = 6) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(initialPage);

  // ─── Query ─────────────────────────────────────────────────────────
  const {
    data,
    error,
    isLoading,
    isError,
    isSuccess,
    refetch,
  } = useQuery<ListResult, Error>({
    queryKey: [QUERY_KEY, page, limit],
    queryFn: async () => {
      const result = await service.listAcademicYears({ page, limit });
      if (!result.ok) {
        throw new Error(result.error.message || "Failed to load academic years");
      }
      return {
        data: result.data.items,
        meta: { total: result.data.total, pages: result.data.pages },
      };
    },
    staleTime: ACADEMIC_YEARS_STALE_TIME,
  });

  // Project-wide AsyncState union — keeping the existing `status`
  // names ("idle"/"loading"/"success"/"empty"/"error") so every
  // consumer that branches on it continues to work without change.
  const state: AsyncState<ListResult> = isLoading
    ? { status: "loading" }
    : isError
      ? { status: "error", error: error?.message || "Failed to load academic years" }
      : isSuccess && data
        ? data.data.length === 0
          ? { status: "empty", data }
          : { status: "success", data }
        : { status: "idle" };

  // ─── Mutations ────────────────────────────────────────────────────
  // We intentionally don't use `useMutation`'s onSuccess to invalidate
  // — it's done inline so the existing call sites (which await the
  // promise) keep their exact ordering: write, then refetch, then
  // toast. Toast text + tone match the original hook.

  const invalidateList = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
  }, [queryClient]);

  const addMutation = useMutation({
    mutationFn: (input: AcademicYearFormInput) => service.createAcademicYear(input),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AcademicYearFormInput> }) =>
      service.updateAcademicYear(id, input),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => service.deleteAcademicYear(id),
  });

  const addAcademicYear = useCallback(
    async (input: AcademicYearFormInput) => {
      const result = await addMutation.mutateAsync(input);
      if (!result.ok) {
        showToast("Failed to create academic year", "error");
        return result;
      }
      showToast("Academic year created.", "success");
      invalidateList();
      return result;
    },
    [addMutation, invalidateList]
  );

  const updateAcademicYear = useCallback(
    async (id: string, input: Partial<AcademicYearFormInput>) => {
      const result = await updateMutation.mutateAsync({ id, input });
      if (!result.ok) {
        showToast("Failed to update academic year", "error");
        return result;
      }
      showToast("Academic year updated.", "success");
      invalidateList();
      return result;
    },
    [updateMutation, invalidateList]
  );

  const deleteAcademicYear = useCallback(
    async (id: string) => {
      const result = await deleteMutation.mutateAsync(id);
      if (!result.ok) {
        showToast("Failed to delete academic year", "error");
        return result;
      }
      showToast("Academic year deleted.", "success");
      invalidateList();
      return result;
    },
    [deleteMutation, invalidateList]
  );

  // `refresh` historically returned the loader's promise. We expose
  // refetch directly — same call signature, same Promise contract.
  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    state,
    page,
    setPage,
    addAcademicYear,
    updateAcademicYear,
    deleteAcademicYear,
    refresh,
  };
}
