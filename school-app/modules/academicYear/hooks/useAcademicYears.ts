"use client";

import { useCallback, useEffect } from "react";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { showToast } from "../../../utils/toast";
import { AcademicYearRow, AcademicYearFormInput } from "../types/academicYear.types";
import * as service from "../services/academicYear.service";

export function useAcademicYears() {
    const { state, run } = useSafeAsync<AcademicYearRow[]>();

    const loadAcademicYears = useCallback(() => {
        return run(async () => {
            const result = await service.listAcademicYears();
            if (!result.ok) {
                throw new Error("Failed to load academic years");
            }
            return result.data as AcademicYearRow[];
        });
    }, [run]);

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

    useEffect(() => {
        loadAcademicYears();
    }, [loadAcademicYears]);

    return { state, addAcademicYear, updateAcademicYear };
}
