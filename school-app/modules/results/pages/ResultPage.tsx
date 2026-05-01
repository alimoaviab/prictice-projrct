"use client";

import { useCallback, useEffect } from "react";
import { colors, spacing, typography } from "@edu/shared/design-system/tokens";
import { Card, DataState } from "../../../components/ui";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { serviceRequest } from "../../../services/service-client";
import { ResultForm } from "../components/ResultForm";
import { ResultTable } from "../components/ResultTable";
import { useResults } from "../hooks/useResults";

export function ResultPage() {
    const { state, addResult } = useResults();
    const { state: examState, run: runExams } = useSafeAsync<Array<{ _id: string; title: string; subject: string; class_name?: string; class_id?: string }>>();
    const { state: studentState, run: runStudents } = useSafeAsync<
        Array<{ _id: string; first_name: string; last_name: string; admission_no: string; class_id: string }>
    >();

    const loadExams = useCallback(() => {
        return runExams(async () => {
            const result = await serviceRequest<Array<{ _id: string; title: string; subject: string; class_name?: string; class_id?: string }>>("/api/exams");
            if (!result.ok) {
                throw new Error(result.error.message || "Failed to load exams");
            }

            return result.data;
        });
    }, [runExams]);

    const loadStudents = useCallback(() => {
        return runStudents(async () => {
            const result = await serviceRequest<
                Array<{ _id: string; first_name: string; last_name: string; admission_no: string; class_id: string }>
            >("/api/students");
            if (!result.ok) {
                throw new Error(result.error.message || "Failed to load students");
            }

            return result.data;
        });
    }, [runStudents]);

    useEffect(() => {
        void loadExams().catch(() => {
            // Error state is already managed by useSafeAsync.
        });
        void loadStudents().catch(() => {
            // Error state is already managed by useSafeAsync.
        });
    }, [loadExams, loadStudents]);

    const isDependencyLoading =
        examState.status === "idle" || examState.status === "loading" || studentState.status === "idle" || studentState.status === "loading";

    const examOptions = (examState.data ?? []).map((item) => ({
        id: item._id,
        class_id: item.class_id,
        label: `${item.title} - ${item.subject}`.trim()
    }));

    const studentOptions = (studentState.data ?? []).map((item) => ({
        id: item._id,
        class_id: item.class_id,
        label: `${item.admission_no} - ${item.first_name} ${item.last_name}`.trim()
    }));

    return (
        <div style={{ display: "grid", gap: spacing.lg }}>
            {isDependencyLoading ? <DataState variant="loading" title="Loading result setup data" /> : null}

            {examState.status === "error" ? <DataState variant="error" title="Exams unavailable" message={examState.error} /> : null}
            {studentState.status === "error" ? <DataState variant="error" title="Students unavailable" message={studentState.error} /> : null}

            {!isDependencyLoading && examOptions.length > 0 && studentOptions.length > 0 ? (
                <Card>
                    <ResultForm examOptions={examOptions} studentOptions={studentOptions} onCreate={addResult} />
                </Card>
            ) : null}

            {state.status === "loading" || state.status === "idle" ? <DataState variant="loading" title="Loading results" /> : null}

            {state.status === "error" ? <DataState variant="error" title="Failed to load results" message={state.error} /> : null}

            {state.status === "empty" ? (
                <DataState variant="empty" title="No results available" message="Enter exam results for students." />
            ) : null}

            {state.status === "success" && state.data && state.data.length > 0 ? (
                <Card style={{ padding: spacing.md }}>
                    <div style={{ marginBottom: spacing.md }}>
                        <h2 style={{ ...typography.h3, margin: 0, color: colors.onSurface }}>Results</h2>
                    </div>
                    <ResultTable rows={state.data} />
                </Card>
            ) : null}
        </div>
    );
}
