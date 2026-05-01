"use client";

import { useCallback, useEffect } from "react";
import { colors, spacing, typography } from "@edu/shared/design-system/tokens";
import { Card, DataState } from "../../../components/ui";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { serviceRequest } from "../../../services/service-client";
import { ExamForm } from "../components/ExamForm";
import { ExamTable } from "../components/ExamTable";
import { useExams } from "../hooks/useExams";

export function ExamPage() {
    const { state, addExam } = useExams();
    const { state: classState, run: runClasses } = useSafeAsync<Array<{ _id: string; name: string }>>();

    const loadClasses = useCallback(() => {
        return runClasses(async () => {
            const result = await serviceRequest<Array<{ _id: string; name: string }>>("/api/classes");
            if (!result.ok) {
                throw new Error(result.error.message || "Failed to load classes");
            }

            return result.data;
        });
    }, [runClasses]);

    useEffect(() => {
        void loadClasses().catch(() => {
            // Error state is already managed by useSafeAsync.
        });
    }, [loadClasses]);

    const isDependencyLoading = classState.status === "idle" || classState.status === "loading";
    const classOptions = (classState.data ?? []).map((item) => ({ id: item._id, label: item.name }));

    return (
        <div style={{ display: "grid", gap: spacing.lg }}>
            {isDependencyLoading ? <DataState variant="loading" title="Loading exam setup data" /> : null}

            {classState.status === "error" ? <DataState variant="error" title="Classes unavailable" message={classState.error} /> : null}

            {!isDependencyLoading && classOptions.length > 0 ? (
                <Card>
                    <ExamForm classOptions={classOptions} onCreate={addExam} />
                </Card>
            ) : null}

            {state.status === "loading" || state.status === "idle" ? (
                <DataState variant="loading" title="Loading exams" />
            ) : null}

            {state.status === "error" ? <DataState variant="error" title="Failed to load exams" message={state.error} /> : null}

            {state.status === "empty" ? (
                <DataState variant="empty" title="No exams scheduled" message="Schedule exams for your academic year." />
            ) : null}

            {state.status === "success" && state.data && state.data.length > 0 ? (
                <Card style={{ padding: spacing.md }}>
                    <div style={{ marginBottom: spacing.md }}>
                        <h2 style={{ ...typography.h3, margin: 0, color: colors.onSurface }}>Exams</h2>
                    </div>
                    <ExamTable rows={state.data} />
                </Card>
            ) : null}
        </div>
    );
}
