"use client";

import { Card, DataState, Skeleton, TableSkeleton } from "../../../components/ui";
import { useCallback, useEffect } from "react";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { serviceRequest } from "../../../services/service-client";
import { ExamForm } from "../components/ExamForm";
import { ExamTable } from "../components/ExamTable";
import { useExams } from "../hooks/useExams";

export function ExamPage() {
    const { state, addExam } = useExams();
    const { state: classState, run: runClasses } = useSafeAsync<any[]>();
    const { state: subjectState, run: runSubjects } = useSafeAsync<any[]>();

    const loadData = useCallback(() => {
        const p1 = runClasses(async () => {
            const result = await serviceRequest<any[]>("/api/classes");
            if (!result.ok) throw new Error(result.error.message || "Failed to load classes");
            return result.data;
        });
        const p2 = runSubjects(async () => {
            const result = await serviceRequest<any[]>("/api/subjects");
            if (!result.ok) throw new Error(result.error.message || "Failed to load subjects");
            return result.data;
        });
        return Promise.all([p1, p2]);
    }, [runClasses, runSubjects]);

    useEffect(() => {
        void loadData().catch(() => {});
    }, [loadData]);

    const isDependencyLoading = 
        classState.status === "idle" || classState.status === "loading" ||
        subjectState.status === "idle" || subjectState.status === "loading";

    return (
        <div className="flex flex-col gap-8">
            <Card className="max-w-4xl">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Schedule Exam</h2>
                    <p className="text-sm text-gray-500">Create a new examination schedule for specific classes and subjects.</p>
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
                    <ExamForm 
                        classes={classState.data ?? []} 
                        allSubjects={subjectState.data ?? []} 
                        onCreate={addExam} 
                    />
                )}
            </Card>

            {classState.status === "error" ? <DataState variant="error" title="Classes unavailable" message={classState.error} /> : null}

            {state.status === "loading" || state.status === "idle" ? (
                <div className="space-y-4">
                   <Skeleton className="h-8 w-48" />
                   <TableSkeleton />
                </div>
            ) : null}

            {state.status === "error" ? <DataState variant="error" title="Failed to load exams" message={state.error} /> : null}

            {state.status === "empty" ? (
                <DataState variant="empty" title="No exams scheduled" message="Schedule exams for your academic year." />
            ) : null}

            {state.status === "success" && state.data && state.data.length > 0 ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Scheduled Exams</h3>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                           {state.data.length} Total
                        </span>
                    </div>
                    <ExamTable rows={state.data} />
                </div>
            ) : null}
        </div>
    );
}
