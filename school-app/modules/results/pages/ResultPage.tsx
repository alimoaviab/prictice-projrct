"use client";

import { useCallback, useEffect } from "react";
import { Card, DataState, Skeleton, TableSkeleton } from "../../../components/ui";
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
        <div className="flex flex-col gap-8">
            <Card className="max-w-4xl">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Record Results</h2>
                    <p className="text-sm text-gray-500">Enter and publish student performance for completed examinations.</p>
                </div>
                {isDependencyLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                ) : (
                    <ResultForm examOptions={examOptions} studentOptions={studentOptions} onCreate={addResult} />
                )}
            </Card>

            {examState.status === "error" ? <DataState variant="error" title="Exams unavailable" message={examState.error} /> : null}
            {studentState.status === "error" ? <DataState variant="error" title="Students unavailable" message={studentState.error} /> : null}

            {state.status === "loading" || state.status === "idle" ? (
                <div className="space-y-4">
                   <Skeleton className="h-8 w-48" />
                   <TableSkeleton />
                </div>
            ) : null}

            {state.status === "error" ? <DataState variant="error" title="Failed to load results" message={state.error} /> : null}

            {state.status === "empty" ? (
                <DataState variant="empty" title="No results available" message="Enter exam results for students." />
            ) : null}

            {state.status === "success" && state.data && state.data.length > 0 ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Published Results</h3>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                           {state.data.length} Records
                        </span>
                    </div>
                    <ResultTable rows={state.data} />
                </div>
            ) : null}
        </div>
    );
}
