"use client";

import { useCallback, useEffect } from "react";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { showToast } from "../../../utils/toast";
import { setSelectedAcademicYearId } from "../../../services/academic-year-context";
import { ClassFormInput, ClassRow } from "../types/class.types";
import * as service from "../services/class.service";

export function useClasses(params?: { page?: number; limit?: number }) {
    const { state, run } = useSafeAsync<service.ClassListResponse>();

    const pageKey = `${params?.page}-${params?.limit}`;

    const loadClasses = useCallback(() => {
        return run(async () => {
            const result = await service.listClasses(params);
            if (!result.success) {
                throw new Error(result.message || "Failed to load classes");
            }
            return result.data;
        });
    }, [run, pageKey]);

    const addClass = useCallback(
        async (input: ClassFormInput) => {
            const result = await service.createClass(input);
            if (!result.success) {
                showToast(result.message || "Failed to create class", "error");
                return result;
            }

            if (input.academic_year_id) {
                setSelectedAcademicYearId(input.academic_year_id);
            }

            showToast("Class created.", "success");
            await loadClasses();
            return result;
        },
        [loadClasses]
    );

    const updateClass = useCallback(
        async (id: string, input: Partial<ClassFormInput>) => {
            const result = await service.updateClass(id, input);
            if (!result.success) {
                showToast(result.message || "Failed to update class", "error");
                return result;
            }

            showToast("Class updated.", "success");
            await loadClasses();
            return result;
        },
        [loadClasses]
    );

    const deleteClass = useCallback(
        async (id: string) => {
            const result = await service.deleteClass(id);
            if (!result.success) {
                showToast(result.message || "Failed to delete class", "error");
                return result;
            }

            showToast("Class deleted.", "success");
            await loadClasses();
            return result;
        },
        [loadClasses]
    );

    useEffect(() => {
        void loadClasses().catch(() => {});
    }, [loadClasses]);

    return { state, addClass, updateClass, deleteClass, refresh: loadClasses };
}
