import { useCallback, useEffect } from "react";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { showToast } from "@/utils/toast";
import { setSelectedAcademicYearId } from "@/services/academic-year-context";
import { ClassFormInput } from "../types/class.types";
import { bindRefresh, publish } from "@/services/data-bus";
import * as service from "../services/class.service";

/**
 * Classes list hook.
 *
 * Bug history (Task 3 of UI/UX phase):
 *   Newly created classes did not appear in the list, the timetable
 *   class selector, or any other dropdown that depends on classes. Root
 *   cause: useSafeAsync state is per-hook-instance, and the loader was
 *   only re-run when its own pageKey changed. Sibling components that
 *   read from a separate useClasses() instance never refreshed when
 *   another component created a class.
 *
 * Fix: every mutation publishes on the "classes" channel of the in-memory
 * data bus, and every useClasses() instance subscribes to that channel
 * and re-fetches. Same for cross-domain dropdowns that read classes via
 * /api/classes — they subscribe on the same channel from their own hooks.
 */
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            // Notify every other useClasses() instance and every dropdown
            // (timetable, homework, exams, etc.) to re-fetch.
            publish("classes");
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
            publish("classes");
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
            publish("classes");
            return result;
        },
        [loadClasses]
    );

    useEffect(() => {
        void loadClasses().catch(() => {});
        // Subscribe so that any other useClasses() instance creating a
        // class causes this instance to refresh as well.
        return bindRefresh("classes", loadClasses);
    }, [loadClasses]);

    return { state, addClass, updateClass, deleteClass, refresh: loadClasses };
}
