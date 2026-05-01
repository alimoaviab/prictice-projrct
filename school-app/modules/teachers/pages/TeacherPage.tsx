"use client";

import { colors, spacing, typography } from "@edu/shared/design-system/tokens";
import { useCallback, useEffect } from "react";
import { Card, DataState } from "../../../components/ui";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { serviceRequest } from "../../../services/service-client";
import { TeacherForm } from "../components/TeacherForm";
import { TeacherTable } from "../components/TeacherTable";
import { useTeachers } from "../hooks/useTeachers";

export function TeacherPage() {
    const { state, addTeacher } = useTeachers();
    const { state: classState, run } = useSafeAsync<Array<{ _id: string; name: string }>>();

    const loadClasses = useCallback(() => {
        return run(async () => {
            const result = await serviceRequest<Array<{ _id: string; name: string }>>("/api/classes");
            if (!result.ok) {
                throw new Error(result.error.message || "Failed to load classes");
            }

            return result.data;
        });
    }, [run]);

    useEffect(() => {
        void loadClasses().catch(() => {
            // Error state is already managed by useSafeAsync.
        });
    }, [loadClasses]);

    const isClassDependencyLoading = classState.status === "idle" || classState.status === "loading";

    const classOptions = (classState.data ?? []).map((item) => ({ id: item._id, label: item.name }));

    return (
        <div style={{ display: "grid", gap: spacing.lg }}>
            {isClassDependencyLoading ? <DataState variant="loading" title="Loading class options" /> : null}

            {classState.status === "error" ? (
                <DataState variant="error" title="Failed to load classes" message={classState.error} />
            ) : null}

            {!isClassDependencyLoading ? <Card>{<TeacherForm onCreate={addTeacher} classOptions={classOptions} />}</Card> : null}

            {state.status === "loading" || state.status === "idle" ? <DataState variant="loading" title="Loading teachers" /> : null}

            {state.status === "error" ? <DataState variant="error" title="Failed to load teachers" message={state.error} /> : null}

            {state.status === "empty" ? <DataState variant="empty" title="No teachers found" message="Add the first teacher to your school." /> : null}

            {state.status === "success" && state.data && state.data.length > 0 ? (
                <Card style={{ padding: 0, overflow: "hidden", borderColor: colors.cardBorder }}>
                    <div style={{ padding: spacing.md, borderBottom: `1px solid ${colors.cardBorder}`, background: colors.surfaceContainerLowest }}>
                        <h2 style={{ ...typography.h3, margin: 0, color: colors.onSurface }}>Teachers</h2>
                    </div>
                    <div style={{ padding: spacing.md }}>
                        <TeacherTable teachers={state.data} />
                    </div>
                </Card>
            ) : null}
        </div>
    );
}
