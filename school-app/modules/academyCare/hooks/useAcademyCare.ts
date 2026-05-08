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
            // Extract items from the paginated response
            return result.data.items;
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

    const updateAcademyYear = useCallback(
        async (id: string, input: Partial<AcademyYearFormInput>) => {
            const result = await service.updateAcademyYear(id, input);
            if (!result.ok) {
                showToast("Failed to update academic year", "error");
                return result;
            }
            showToast("Academic year updated.", "success");
            await loadAcademyYears();
            return result;
        },
        [loadAcademyYears]
    );

    const deleteAcademyYear = useCallback(
        async (id: string) => {
            const result = await service.deleteAcademyYear(id);
            if (!result.ok) {
                showToast("Failed to delete academic year", "error");
                return result;
            }
            showToast("Academic year deleted.", "success");
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

    return { state, addAcademyYear, updateAcademyYear, deleteAcademyYear };
}
