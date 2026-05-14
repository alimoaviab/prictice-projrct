import { useCallback, useEffect } from "react";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { showToast } from "@/utils/toast";
import { TeacherRow, TeacherFormInput } from "../types/teacher.types";
import { bindRefresh, publish } from "@/services/data-bus";
import * as service from "../services/teacher.service";

export function useTeachers() {
    const { state, run } = useSafeAsync<TeacherRow[]>();

    const loadTeachers = useCallback(() => {
        return run(async () => {
            const result = await service.listTeachers();
            if (!result.success) {
                throw new Error(result.message || "Failed to load teachers");
            }
            return result.data as TeacherRow[];
        });
    }, [run]);

    const addTeacher = useCallback(
        async (input: TeacherFormInput) => {
            const result = await service.createTeacher(input);
            if (!result.success) {
                showToast(result.message || "Failed to create teacher", "error");
                return result;
            }
            showToast("Teacher created.", "success");
            await loadTeachers();
            publish("teachers");
            return result;
        },
        [loadTeachers]
    );

    const updateTeacher = useCallback(
        async (id: string, input: Partial<TeacherFormInput>) => {
            const result = await service.updateTeacher(id, input);
            if (!result.success) {
                showToast(result.message || "Failed to update teacher", "error");
                return result;
            }
            showToast("Teacher updated.", "success");
            await loadTeachers();
            publish("teachers");
            return result;
        },
        [loadTeachers]
    );

    const deleteTeacher = useCallback(
        async (id: string) => {
            const result = await service.deleteTeacher(id);
            if (!result.success) {
                showToast(result.message || "Failed to delete teacher", "error");
                return result;
            }
            showToast("Teacher deleted.", "success");
            await loadTeachers();
            publish("teachers");
            return result;
        },
        [loadTeachers]
    );

    useEffect(() => {
        void loadTeachers().catch(() => {
            // Error state is already managed by useSafeAsync.
        });
        return bindRefresh("teachers", loadTeachers);
    }, [loadTeachers]);

    return { state, addTeacher, updateTeacher, deleteTeacher, refresh: loadTeachers };
}
