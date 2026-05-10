"use client";

import { useMemo, useState } from "react";
import { Card, DataState, ListToolbar, Skeleton, TableSkeleton } from "../../../components/ui";
import { useAcademicYears } from "../../academicYear/hooks/useAcademicYears";
import { useTeachers } from "../../teachers/hooks/useTeachers";
import { useSubjects } from "../../subjects/hooks/useSubjects";
import { showToast } from "../../../utils/toast";
import { ClassForm } from "../components/ClassForm";
import { ClassTable } from "../components/ClassTable";
import { useClasses } from "../hooks/useClasses";

export function ClassPage() {
    const { state, addClass } = useClasses();
    const { state: academicYearState } = useAcademicYears();
    const { state: teacherState } = useTeachers();
    const {
        data: subjects,
        isLoading: subjectsLoading,
        error: subjectsError,
        createSubject,
        refresh: refreshSubjects
    } = useSubjects();

    const isDependencyLoading =
        academicYearState.status === "idle" ||
        academicYearState.status === "loading" ||
        teacherState.status === "idle" ||
        teacherState.status === "loading" ||
        subjectsLoading;

    const hasAcademicYears = (academicYearState.data?.data ?? []).length > 0;
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

    async function handleQuickAddSubject(name: string) {
        try {
            await createSubject({
                name,
                code: name.substring(0, 3).toUpperCase(),
                status: "active"
            });
            showToast(`Subject "${name}" added`, "success");
            await refreshSubjects();
        } catch (error: any) {
            showToast(error.message || "Failed to add subject", "error");
            throw error;
        }
    }

    const filteredRows = useMemo(() => {
        const rows = state.data ?? [];
        const q = searchQuery.trim().toLowerCase();
        return rows.filter((row) => {
            const queryMatch =
                q.length === 0 ||
                row.name.toLowerCase().includes(q) ||
                (row.academy_care_year || "").toLowerCase().includes(q) ||
                row.teacher_names.join(" ").toLowerCase().includes(q) ||
                row.subjects.join(" ").toLowerCase().includes(q);
            const statusMatch = statusFilter === "all" ? true : row.status === statusFilter;
            return queryMatch && statusMatch;
        });
    }, [state.data, searchQuery, statusFilter]);

    return (
        <div className="flex flex-col gap-3">
            {isDependencyLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-[300px] w-full rounded-xl" />
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

            {subjectsError ? (
                <DataState variant="error" title="Subjects unavailable" message={subjectsError} />
            ) : null}

            {!isDependencyLoading && !hasAcademicYears ? (
                <DataState
                    variant="empty"
                    title="Create an academic year first"
                    message="You need at least one academic year before creating classes."
                />
            ) : null}

            {!isDependencyLoading && hasAcademicYears ? (
                <Card className="max-w-4xl p-4">
                    <div className="mb-3">
                        <h2 className="text-lg font-bold tracking-tight text-slate-900 leading-none">Create New Class</h2>
                        <p className="mt-1 text-[13px] font-medium text-slate-500">Set up a new classroom and assign teachers and subjects.</p>
                    </div>
                    <ClassForm
                        onCreate={addClass}
                        academyCareOptions={(academicYearState.data?.data ?? []).map((item: any) => ({
                            id: item._id,
                            label: item.year
                        }))}
                        teacherOptions={(teacherState.data ?? []).map((item: any) => ({
                            id: item._id,
                            label: `${item.first_name} ${item.last_name}`.trim()
                        }))}
                        subjectOptions={(subjects ?? [])
                            .filter((item) => item.status === "active")
                            .map((item) => ({ id: item._id, label: item.name }))}
                    />
                </Card>
            ) : null}

            {state.status === "loading" || state.status === "idle" ? (
                <div className="space-y-3">
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
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold tracking-tight text-slate-950">Classes List</h3>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                            {filteredRows.length} visible
                        </span>
                    </div>

                    <ListToolbar
                        searchValue={searchQuery}
                        onSearchChange={setSearchQuery}
                        searchPlaceholder="Search class, year, teacher, subject"
                        filterValue={statusFilter}
                        onFilterChange={(value) => setStatusFilter(value as "all" | "active" | "inactive")}
                        filterOptions={[
                            { value: "all", label: "All statuses" },
                            { value: "active", label: "Active" },
                            { value: "inactive", label: "Inactive" },
                        ]}
                    />

                    <ClassTable rows={filteredRows} />
                </div>
            ) : null}
        </div>
    );
}
