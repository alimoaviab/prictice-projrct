"use client";

import { useCallback, useEffect } from "react";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { showToast } from "../../../utils/toast";
import { TeacherRow, TeacherFormInput } from "../types/teacher.types";
import * as service from "../services/teacher.service";

export function useTeachers() {
    const { state, run } = useSafeAsync<TeacherRow[]>();

    const loadTeachers = useCallback(() => {
        return run(async () => {
            const result = await service.listTeachers();
            if (!result.ok) {
                throw new Error(result.error.message || "Failed to load teachers");
            }
            return result.data as TeacherRow[];
        });
    }, [run]);

    const addTeacher = useCallback(
        async (input: TeacherFormInput) => {
            const result = await service.createTeacher(input);
            if (!result.ok) {
                showToast(result.error.message || "Failed to create teacher", "error");
                return result;
            }
            showToast("Teacher created.", "success");
            await loadTeachers();
            return result;
        },
        [loadTeachers]
    );

    useEffect(() => {
        void loadTeachers().catch(() => {
            // Error state is already managed by useSafeAsync.
        });
    }, [loadTeachers]);

    return { state, addTeacher };
}
