/**
 * Student edit page — visually identical to StudentCreatePage. Loads the
 * student record by ID, pre-fills the shared StudentForm in `mode="edit"`,
 * and submits an update.
 *
 * Route: /admin/students/edit/:id
 */

import { useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, Skeleton, DataState } from "@/components/ui";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import { StudentForm } from "../components/StudentForm";
import { useStudents } from "../hooks/useStudents";
import { StudentFormInput, StudentRow } from "../types/student.types";
import { getStudent } from "../services/student.service";

// Module-scope stable refs — see TeacherEditPage for the rationale.
// useSafeAsync's isEmpty arg is in its useCallback deps; an inline arrow
// would be a fresh reference every render and trigger a refetch loop.
const NEVER_EMPTY = (): boolean => false;
const ARRAY_IS_EMPTY = (v: unknown[]): boolean => Array.isArray(v) && v.length === 0;

export function StudentEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { updateStudent } = useStudents();

    const { state: studentState, run: runStudent } = useSafeAsync<StudentRow>(NEVER_EMPTY);
    const { state: classState, run: runClasses } = useSafeAsync<
        Array<{ _id: string; name: string; section?: string }>
    >(ARRAY_IS_EMPTY);

    const loadStudent = useCallback(() => {
        if (!id) return Promise.resolve(undefined);
        return runStudent(async () => {
            const result = await getStudent(id);
            if (!result.ok) {
                throw new Error(result.error?.message || "Failed to load student record");
            }
            return result.data!;
        });
    }, [id, runStudent]);

    const loadClasses = useCallback(() => {
        return runClasses(async () => {
            const result = await serviceRequest<any>("/api/classes");
            if (!result.ok) {
                throw new Error(result.error?.message || "Failed to load classes");
            }
            const raw = result.data;
            return Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
        });
    }, [runClasses]);

    useEffect(() => {
        void loadStudent().catch(() => {});
        void loadClasses().catch(() => {});
    }, [loadStudent, loadClasses]);

    async function handleUpdate(input: StudentFormInput) {
        if (!id) return;
        const result = await updateStudent(id, input);
        if (result && (result as any).success !== false) {
            // Toast is already raised by useStudents on success.
            navigate("/admin/students");
        }
        return result;
    }

    const studentLoading =
        studentState.status === "idle" || studentState.status === "loading";
    const classLoading =
        classState.status === "idle" || classState.status === "loading";

    const classOptions = (classState.data ?? []).map((item) => ({
        id: item._id,
        label: item.name,
        section: item.section || "",
    }));

    if (studentState.status === "error") {
        return (
            <div className="w-full py-2 px-6">
                <Card className="p-4 md:p-6 border-slate-200/60 bg-white shadow-2xl shadow-slate-200/50 rounded-3xl">
                    <DataState
                        variant="error"
                        title="Failed to load student"
                        message={studentState.error}
                        onRetry={loadStudent}
                    />
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full py-2 px-6">
            <Card className="p-4 md:p-6 border-slate-200/60 bg-white shadow-2xl shadow-slate-200/50 rounded-3xl">
                {classState.status === "error" ? (
                    <DataState
                        variant="error"
                        title="Failed to load classes"
                        message={classState.error}
                        onRetry={loadClasses}
                    />
                ) : studentLoading || classLoading || !studentState.data ? (
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <Skeleton className="h-10 w-full" />
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <Skeleton className="h-32 w-full" />
                    </div>
                ) : (
                    <StudentForm
                        mode="edit"
                        onSubmit={handleUpdate}
                        onCancel={() => navigate("/admin/students")}
                        classOptions={classOptions}
                        initialValues={studentState.data}
                    />
                )}
            </Card>
        </div>
    );
}
