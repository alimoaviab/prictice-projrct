/**
 * Teacher edit page. Visually identical to TeacherCreatePage — same
 * EntityCreateLayout chrome, same form, same guidance sidebar — just
 * pre-filled with the existing teacher's data and submitting an update.
 *
 * Route: /admin/teachers/edit/:id
 */

import { useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Skeleton,
    DataState,
    EntityCreateLayout,
    GuidanceSection,
    GuidanceCallout,
    GuidanceChecklist,
} from "@/components/ui";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import { TeacherForm } from "../components/TeacherForm";
import { useTeachers } from "../hooks/useTeachers";
import { TeacherFormInput, TeacherRow } from "../types/teacher.types";
import { showToast } from "@/utils/toast";
import { bindRefresh } from "@/services/data-bus";
import { getTeacher } from "../services/teacher.service";

// Stable module-level refs for useSafeAsync isEmpty checks. An inline
// arrow would be a fresh reference every render → re-creates `run` →
// re-creates `loadX` → re-fires the effect → infinite refetch loop.
const NEVER_EMPTY = (): boolean => false;
const ARRAY_IS_EMPTY = (v: any[]): boolean => Array.isArray(v) && v.length === 0;

export function TeacherEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { updateTeacher } = useTeachers();

    const { state: teacherState, run: runTeacher } = useSafeAsync<TeacherRow>(
        // Disable empty-detection — a teacher object is never "empty".
        NEVER_EMPTY
    );
    const { state: classState, run: runClasses } = useSafeAsync<
        Array<{ _id: string; name: string }>
    >(ARRAY_IS_EMPTY);

    // ─── Loaders ────────────────────────────────────────────────────────

    const loadTeacher = useCallback(() => {
        if (!id) return Promise.resolve(undefined);
        return runTeacher(async () => {
            const result = await getTeacher(id);
            if (!result.ok) {
                throw new Error(
                    result.error?.message || "Failed to load teacher record"
                );
            }
            return result.data!;
        });
    }, [id, runTeacher]);

    const loadClasses = useCallback(() => {
        return runClasses(async () => {
            const result = await serviceRequest<any>("/api/classes");
            if (!result.ok) {
                throw new Error(result.error?.message || "Failed to load classes");
            }
            const data: any = result.data;
            if (Array.isArray(data)) return data;
            return Array.isArray(data?.data) ? data.data : [];
        });
    }, [runClasses]);

    useEffect(() => {
        void loadTeacher().catch(() => {});
        void loadClasses().catch(() => {});
        const offClasses = bindRefresh("classes", loadClasses);
        const offTeachers = bindRefresh("teachers", loadTeacher);
        return () => {
            offClasses();
            offTeachers();
        };
    }, [loadTeacher, loadClasses]);

    // ─── Submit ─────────────────────────────────────────────────────────

    async function handleUpdate(input: TeacherFormInput) {
        if (!id) return;
        const result = await updateTeacher(id, input);
        if (result && result.success !== false) {
            // showToast is already raised by useTeachers on success.
            navigate("/admin/teachers");
        }
        return result;
    }

    // ─── Derived state ──────────────────────────────────────────────────

    const teacherLoading =
        teacherState.status === "idle" || teacherState.status === "loading";
    const classLoading =
        classState.status === "idle" || classState.status === "loading";

    const classOptions = (classState.data ?? []).map((item) => ({
        id: item._id,
        label: item.name,
    }));

    const teacherName = teacherState.data
        ? `${teacherState.data.first_name ?? ""} ${
              teacherState.data.last_name ?? ""
          }`.trim() || teacherState.data.email
        : "";

    // ─── Render ─────────────────────────────────────────────────────────

    if (teacherState.status === "error") {
        return (
            <EntityCreateLayout
                backTo="/admin/teachers"
                backLabel="Return to Faculty"
                eyebrow="Faculty Management"
                icon="badge"
                title="Edit Teacher"
                subtitle="Update an existing faculty profile."
                aside={
                    <GuidanceSection title="Loading failed">
                        We couldn't load this teacher's record. Try refreshing or
                        return to the directory.
                    </GuidanceSection>
                }
            >
                <DataState
                    variant="error"
                    title="Failed to load teacher"
                    message={teacherState.error}
                    onRetry={loadTeacher}
                />
            </EntityCreateLayout>
        );
    }

    return (
        <EntityCreateLayout
            backTo="/admin/teachers"
            backLabel="Return to Faculty"
            eyebrow="Faculty Management"
            icon="badge"
            title={teacherName ? `Update ${teacherName}` : "Update Teacher Profile"}
            subtitle="Modify credentials, contact details, or class assignment for this faculty member."
            asideTitle="Editing Intelligence"
            aside={
                <>
                    <GuidanceSection title="What can you change?">
                        Every field on the create form is editable here. Leave the
                        password blank to keep the teacher's current login secret.
                    </GuidanceSection>
                    <GuidanceSection title="Class Reassignment">
                        <GuidanceCallout tone="amber">
                            Changing the primary class doesn't move existing homework
                            or attendance records. Re-issue them from the relevant
                            module if needed.
                        </GuidanceCallout>
                    </GuidanceSection>
                    <GuidanceChecklist
                        items={[
                            {
                                done: classOptions.length > 0,
                                label: "Classes available to assign",
                            },
                            {
                                done: !!teacherState.data?.email,
                                label: "Email reachable",
                            },
                            {
                                done: !!teacherState.data?.phone,
                                label: "Phone on file",
                            },
                        ]}
                    />
                </>
            }
        >
            {classState.status === "error" ? (
                <DataState
                    variant="error"
                    title="Failed to load classes"
                    message={classState.error}
                    onRetry={loadClasses}
                />
            ) : teacherLoading || classLoading || !teacherState.data ? (
                <div className="space-y-4">
                    <Skeleton className="h-11 w-full rounded-xl" />
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-11 w-full rounded-xl" />
                        <Skeleton className="h-11 w-full rounded-xl" />
                    </div>
                    <Skeleton className="h-11 w-full rounded-xl" />
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-11 w-full rounded-xl" />
                        <Skeleton className="h-11 w-full rounded-xl" />
                    </div>
                    <Skeleton className="h-32 w-full rounded-xl" />
                </div>
            ) : (
                <TeacherForm
                    mode="edit"
                    onSubmit={handleUpdate}
                    onCancel={() => navigate("/admin/teachers")}
                    classOptions={classOptions}
                    initialValues={teacherState.data}
                />
            )}
        </EntityCreateLayout>
    );
}
