"use client";

import { colors, spacing, typography } from "@edu/shared/design-system/tokens";
import { useCallback, useEffect } from "react";
import { Card, DataState } from "../../../components/ui";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { serviceRequest } from "../../../services/service-client";
import { HomeworkForm } from "../components/HomeworkForm";
import { HomeworkTable } from "../components/HomeworkTable";
import { useHomework } from "../hooks/useHomework";

export function HomeworkPage() {
    const { state, addHomework } = useHomework();
    const { state: classState, run: runClasses } = useSafeAsync<Array<{ _id: string; name: string }>>();
    const { state: teacherState, run: runTeachers } = useSafeAsync<
        Array<{ _id: string; first_name: string; last_name: string; employee_no: string }>
    >();

    const loadClasses = useCallback(() => {
        return runClasses(async () => {
            const result = await serviceRequest<Array<{ _id: string; name: string }>>("/api/classes");
            if (!result.ok) {
                throw new Error(result.error.message || "Failed to load classes");
            }

            return result.data;
        });
    }, [runClasses]);

    const loadTeachers = useCallback(() => {
        return runTeachers(async () => {
            const result = await serviceRequest<Array<{ _id: string; first_name: string; last_name: string; employee_no: string }>>(
                "/api/teachers"
            );
            if (!result.ok) {
                throw new Error(result.error.message || "Failed to load teachers");
            }

            return result.data;
        });
    }, [runTeachers]);

    useEffect(() => {
        void loadClasses().catch(() => {
            // Error state is already managed by useSafeAsync.
        });
        void loadTeachers().catch(() => {
            // Error state is already managed by useSafeAsync.
        });
    }, [loadClasses, loadTeachers]);

    const isDependencyLoading =
        classState.status === "idle" ||
        classState.status === "loading" ||
        teacherState.status === "idle" ||
        teacherState.status === "loading";

    const classOptions = (classState.data ?? []).map((item) => ({ id: item._id, label: item.name }));
    const teacherOptions = (teacherState.data ?? []).map((item) => ({
        id: item._id,
        label: `${item.employee_no} - ${item.first_name} ${item.last_name}`.trim()
    }));

    return (
        <div style={{ display: "grid", gap: spacing.lg }}>
            {isDependencyLoading ? <DataState variant="loading" title="Loading homework setup data" /> : null}

            {classState.status === "error" ? (
                <DataState variant="error" title="Classes unavailable" message={classState.error} />
            ) : null}

            {teacherState.status === "error" ? (
                <DataState variant="error" title="Teachers unavailable" message={teacherState.error} />
            ) : null}

            {!isDependencyLoading ? (
                <Card>
                    <HomeworkForm onCreate={addHomework} classOptions={classOptions} teacherOptions={teacherOptions} />
                </Card>
            ) : null}

            {state.status === "loading" || state.status === "idle" ? (
                <DataState variant="loading" title="Loading homework records" />
            ) : null}

            {state.status === "error" ? (
                <DataState variant="error" title="Failed to load homework" message={state.error} />
            ) : null}

            {state.status === "empty" ? (
                <DataState variant="empty" title="No homework assigned" message="Create homework for your classes." />
            ) : null}

            {state.status === "success" && state.data && state.data.length > 0 ? (
                <Card style={{ padding: 0, overflow: "hidden", borderColor: colors.cardBorder }}>
                    <div style={{ padding: spacing.md, borderBottom: `1px solid ${colors.cardBorder}`, background: colors.surfaceContainerLowest }}>
                        <h2 style={{ ...typography.h3, margin: 0, color: colors.onSurface }}>Homework Records</h2>
                    </div>
                    <div style={{ padding: spacing.md }}>
                        <HomeworkTable rows={state.data} />
                    </div>
                </Card>
            ) : null}
        </div>
    );
}
