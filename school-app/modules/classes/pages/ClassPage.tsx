"use client";

import { Card, DataState, Skeleton, TableSkeleton } from "../../../components/ui";
import { useAcademicYears } from "../../academicYear/hooks/useAcademicYears";
import { useTeachers } from "../../teachers/hooks/useTeachers";
import { ClassForm } from "../components/ClassForm";
import { ClassTable } from "../components/ClassTable";
import { useClasses } from "../hooks/useClasses";

export function ClassPage() {
    const { state, addClass } = useClasses();
    const { state: academicYearState } = useAcademicYears();
    const { state: teacherState } = useTeachers();

    const isDependencyLoading =
        academicYearState.status === "idle" ||
        academicYearState.status === "loading" ||
        teacherState.status === "idle" ||
        teacherState.status === "loading";

    const hasAcademicYears = (academicYearState.data ?? []).length > 0;

    return (
        <div className="flex flex-col gap-8">
            {isDependencyLoading ? (
                <div className="space-y-6">
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                    <TableSkeleton />
                </div>
            ) : null}

            {academicYearState.status === "error" ? (
                <DataState
                    variant="error"
                    title="Academic years unavailable"
                    message={academicYearState.error}
                />
            ) : null}

            {teacherState.status === "error" ? (
                <DataState variant="error" title="Teachers unavailable" message={teacherState.error} />
            ) : null}

            {!isDependencyLoading && !hasAcademicYears ? (
                <DataState
                    variant="empty"
                    title="Create an academic year first"
                    message="You need at least one academic year before creating classes."
                />
            ) : null}

            {!isDependencyLoading && hasAcademicYears ? (
                <Card className="max-w-4xl">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Create New Class</h2>
                        <p className="text-sm text-gray-500">Set up a new classroom and assign teachers and subjects.</p>
                    </div>
                    <ClassForm
                        onCreate={addClass}
                        academyCareOptions={(academicYearState.data ?? []).map((item) => ({
                            id: item._id,
                            label: item.year
                        }))}
                        teacherOptions={(teacherState.data ?? []).map((item) => ({
                            id: item._id,
                            label: `${item.first_name} ${item.last_name}`.trim()
                        }))}
                    />
                </Card>
            ) : null}

            {state.status === "loading" || state.status === "idle" ? (
                <div className="space-y-4">
                   <Skeleton className="h-8 w-48" />
                   <TableSkeleton />
                </div>
            ) : null}

            {state.status === "error" ? (
                <DataState variant="error" title="Failed to load classes" message={state.error} />
            ) : null}

            {state.status === "empty" && !isDependencyLoading && hasAcademicYears ? (
                <DataState variant="empty" title="No classes created" message="Create your first class to begin." />
            ) : null}

            {state.status === "success" && state.data && state.data.length > 0 ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Classes List</h3>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                           {state.data.length} Total
                        </span>
                    </div>
                    <ClassTable rows={state.data} />
                </div>
            ) : null}
        </div>
    );
}
