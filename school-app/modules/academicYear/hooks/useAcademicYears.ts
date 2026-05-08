"use client";

import { useCallback, useEffect, useState } from "react";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { showToast } from "../../../utils/toast";
import { AcademicYearRow, AcademicYearFormInput } from "../types/academicYear.types";
import * as service from "../services/academicYear.service";

export function useAcademicYears(initialPage = 1, limit = 9) {
    const { state, run } = useSafeAsync<{ data: AcademicYearRow[]; meta?: { total: number; pages: number } }>();
    const [page, setPage] = useState(initialPage);

    const loadAcademicYears = useCallback((targetPage?: number) => {
        const activePage = targetPage ?? page;
        return run(async () => {
            const result = await service.listAcademicYears({ page: activePage, limit });
            if (!result.ok) {
                throw new Error(result.error.message || "Failed to load academic years");
            }
            return {
                data: result.data.items,
                meta: {
                    total: result.data.total,
                    pages: result.data.pages
                }
            };
        });
    }, [run, page, limit]);

    const addAcademicYear = useCallback(
        async (input: AcademicYearFormInput) => {
            const result = await service.createAcademicYear(input);
            if (!result.ok) {
                showToast("Failed to create academic year", "error");
                return result;
            }
            showToast("Academic year created.", "success");
            await loadAcademicYears();
            return result;
        },
        [loadAcademicYears]
    );

    const updateAcademicYear = useCallback(
        async (id: string, input: Partial<AcademicYearFormInput>) => {
            const result = await service.updateAcademicYear(id, input);
            if (!result.ok) {
                showToast("Failed to update academic year", "error");
                return result;
            }
            showToast("Academic year updated.", "success");
            await loadAcademicYears();
            return result;
        },
        [loadAcademicYears]
    );

    const deleteAcademicYear = useCallback(
        async (id: string) => {
            const result = await service.deleteAcademicYear(id);
            if (!result.ok) {
                showToast("Failed to delete academic year", "error");
                return result;
            }
            showToast("Academic year deleted.", "success");
            await loadAcademicYears();
            return result;
        },
        [loadAcademicYears]
    );

    useEffect(() => {
        void loadAcademicYears().catch(() => {
            // Error state managed by useSafeAsync
        });
    }, [loadAcademicYears]);

    return { state, page, setPage, addAcademicYear, updateAcademicYear, deleteAcademicYear, refresh: loadAcademicYears };
}
