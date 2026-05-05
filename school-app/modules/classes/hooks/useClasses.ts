"use client";

import { useCallback, useEffect } from "react";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { showToast } from "../../../utils/toast";
import { setSelectedAcademyCareId } from "../../../services/academy-care-context";
import { ClassFormInput, ClassRow } from "../types/class.types";
import * as service from "../services/class.service";

export function useClasses() {
    const { state, run } = useSafeAsync<ClassRow[]>();

    const loadClasses = useCallback(() => {
        return run(async () => {
            const result = await service.listClasses();
            if (!result.success) {
                throw new Error(result.message || "Failed to load classes");
            }

            return result.data;
        });
    }, [run]);

    const addClass = useCallback(
        async (input: ClassFormInput) => {
            const result = await service.createClass(input);
            if (!result.success) {
                showToast(result.message || "Failed to create class", "error");
                return result;
            }

            // Keep list filter aligned with the just-created class year so it appears immediately.
            if (input.academy_care_id) {
                setSelectedAcademyCareId(input.academy_care_id);
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
        void loadClasses().catch(() => {
            // Error state is already managed by useSafeAsync.
        });
    }, [loadClasses]);

    return { state, addClass, updateClass, deleteClass };
}
