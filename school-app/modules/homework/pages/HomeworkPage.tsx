"use client";

import { Card, DataState, Skeleton, TableSkeleton } from "../../../components/ui";
import { useCallback, useEffect } from "react";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { serviceRequest } from "../../../services/service-client";
import { HomeworkForm } from "../components/HomeworkForm";
import { HomeworkTable } from "../components/HomeworkTable";
import { useHomework } from "../hooks/useHomework";
import { useSubjects } from "../../subjects/hooks/useSubjects";

export function HomeworkPage() {
    const { state, addHomework } = useHomework();
    const { state: classState, run: runClasses } = useSafeAsync<Array<{ _id: string; name: string }>>();
    const { state: teacherState, run: runTeachers } = useSafeAsync<
        Array<{ _id: string; first_name: string; last_name: string; employee_no: string }>
    >();
    const { data: subjectData, isLoading: subjectLoading, error: subjectError } = useSubjects();

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
        void loadClasses().catch(() => { });
        void loadTeachers().catch(() => { });
    }, [loadClasses, loadTeachers]);

    const isDependencyLoading =
        classState.status === "idle" ||
        classState.status === "loading" ||
        teacherState.status === "idle" ||
        teacherState.status === "loading" ||
        subjectLoading;

    const classOptions = (classState.data ?? []).map((item) => ({ id: item._id, label: item.name }));
    const teacherOptions = (teacherState.data ?? []).map((item) => ({
        id: item._id,
        label: `${item.employee_no} - ${item.first_name} ${item.last_name}`.trim()
    }));
    const subjectOptions = (subjectData ?? []).map((item: any) => ({ id: item._id, label: item.name }));

    return (
        <div className="flex flex-col gap-8">
            <Card className="max-w-4xl">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Assign Homework</h2>
                    <p className="text-sm text-gray-500">Create and distribute new assignments to specific classes.</p>
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
                    <HomeworkForm onCreate={addHomework} classOptions={classOptions} teacherOptions={teacherOptions} subjectOptions={subjectOptions} />
                )}
            </Card>

            {classState.status === "error" ? (
                <DataState variant="error" title="Classes unavailable" message={classState.error} />
            ) : null}

            {teacherState.status === "error" ? (
                <DataState variant="error" title="Teachers unavailable" message={teacherState.error} />
            ) : null}

            {subjectError ? (
                <DataState variant="error" title="Subjects unavailable" message={subjectError} />
            ) : null}

            {state.status === "loading" || state.status === "idle" ? (
                <div className="space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <TableSkeleton />
                </div>
            ) : null}

            {state.status === "error" ? (
                <DataState variant="error" title="Failed to load homework" message={state.error} />
            ) : null}

            {state.status === "empty" ? (
                <DataState variant="empty" title="No homework assigned" message="Create homework for your classes." />
            ) : null}

            {state.status === "success" && state.data && state.data.length > 0 ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Homework Assignments</h3>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {state.data.length} Records
                        </span>
                    </div>
                    <HomeworkTable rows={state.data} />
                </div>
            ) : null}
        </div>
    );
}
