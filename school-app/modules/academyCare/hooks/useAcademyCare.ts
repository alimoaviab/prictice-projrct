"use client";

import { useCallback, useEffect } from "react";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { showToast } from "../../../utils/toast";
import { AcademyYear, AcademyYearFormInput } from "../types/academyCare.types";
import * as service from "../services/academyCare.service";

export function useAcademyCare() {
    const { state, run } = useSafeAsync<AcademyYear[]>();

    const loadAcademyYears = useCallback(() => {
        return run(async () => {
            const result = await service.listAcademyYears();
            if (!result.ok) {
                throw new Error(result.error.message || "Failed to load academic years");
            }
            return result.data as AcademyYear[];
        });
    }, [run]);

    const addAcademyYear = useCallback(
        async (input: AcademyYearFormInput) => {
            const result = await service.createAcademyYear(input);
            if (!result.ok) {
                showToast("Failed to create academic year", "error");
                return result;
            }
            showToast("Academic year created successfully.", "success");
            await loadAcademyYears();
            return result;
        },
        [loadAcademyYears]
    );

    useEffect(() => {
        void loadAcademyYears().catch(() => {
            // Error state is already managed by useSafeAsync.
        });
    }, [loadAcademyYears]);

    return { state, addAcademyYear };
}
