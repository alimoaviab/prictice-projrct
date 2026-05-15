import { useCallback, useEffect, useMemo, useState } from "react";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { showToast } from "@/utils/toast";
import { TeacherRow, TeacherFormInput } from "../types/teacher.types";
import { bindRefresh, publish } from "@/services/data-bus";
import * as service from "../services/teacher.service";
import type { Paginated } from "@/types/pagination";

export interface UseTeachersParams {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
}

export interface TeacherListMeta {
    total: number;
    page: number;
    limit: number;
    pages: number;
}

const DEFAULT_META: TeacherListMeta = { total: 0, page: 1, limit: 0, pages: 1 };

/**
 * Teacher list hook.
 *
 * - When called WITHOUT params, returns ALL teachers (legacy behavior:
 *   `state.data` is `TeacherRow[]`).
 * - When called WITH `{ page, limit, ... }`, the backend returns the
 *   paginated envelope; `state.data` is still `TeacherRow[]` (the items
 *   on the current page) and the server meta is exposed via `meta`.
 *
 * This dual-shape preserves all existing call sites (ClassListPage,
 * ClassCreatePage, etc.) which read `state.data` as an array.
 */
export function useTeachers(params: UseTeachersParams = {}) {
    const { state, run } = useSafeAsync<TeacherRow[]>();
    const [meta, setMeta] = useState<TeacherListMeta>(DEFAULT_META);

    const paramsKey = useMemo(
        () => JSON.stringify({
            page: params.page,
            limit: params.limit,
            status: params.status,
            search: params.search,
        }),
        [params.page, params.limit, params.status, params.search]
    );

    const loadTeachers = useCallback(() => {
        return run(async () => {
            const result = await service.listTeachers(params);
            if (!result.ok) {
                throw new Error(result.error?.message || result.message || "Failed to load teachers");
            }
            const raw = result.data;
            if (Array.isArray(raw)) {
                setMeta({ total: raw.length, page: 1, limit: raw.length, pages: 1 });
                return raw;
            }
            const p = raw as Paginated<TeacherRow>;
            const items = p.items ?? [];
            setMeta({
                total: p.total ?? items.length,
                page: p.page ?? 1,
                limit: p.limit ?? items.length,
                pages: p.pages ?? 1,
            });
            return items;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [run, paramsKey]);

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

    return {
        state,
        meta,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        refresh: loadTeachers,
    };
}
