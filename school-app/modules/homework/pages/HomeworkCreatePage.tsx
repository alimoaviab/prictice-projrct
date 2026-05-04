"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect } from "react";
import { Card, Skeleton, DataState } from "../../../components/ui";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { serviceRequest } from "../../../services/service-client";
import { HomeworkForm } from "../components/HomeworkForm";
import { useHomework } from "../hooks/useHomework";
import { useSubjects } from "../../subjects/hooks/useSubjects";
import { HomeworkFormInput } from "../types/homework.types";
import { showToast } from "../../../utils/toast";

export function HomeworkCreatePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { addHomework } = useHomework();
  const { state: classState, run: runClasses } = useSafeAsync<Array<{ _id: string; name: string }>>();
  const { state: teacherState, run: runTeachers } = useSafeAsync<
    Array<{ _id: string; first_name: string; last_name: string; employee_no: string }>
  >();
  const { data: subjectData, isLoading: subjectLoading, error: subjectError } = useSubjects();

  const loadClasses = useCallback(() => {
    return runClasses(async () => {
      const result = await serviceRequest<Array<{ _id: string; name: string }>>("/api/classes");
      if (!result.ok) throw new Error(result.error.message || "Failed to load classes");
      return result.data;
    });
  }, [runClasses]);

  const loadTeachers = useCallback(() => {
    return runTeachers(async () => {
      const result = await serviceRequest<
        Array<{ _id: string; first_name: string; last_name: string; employee_no: string }>
      >("/api/teachers");
      if (!result.ok) throw new Error(result.error.message || "Failed to load teachers");
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
    label: `${item.employee_no} - ${item.first_name} ${item.last_name}`.trim(),
  }));
  const subjectOptions = (subjectData ?? []).map((item: any) => ({ id: item._id, label: item.name }));

  async function handleCreate(input: HomeworkFormInput) {
    const result = await addHomework(input);
    if (result && (result as { ok?: boolean }).ok !== false) {
      showToast("Homework assigned successfully", "success");
      const basePath = pathname.includes("/teacher") ? "/teacher/homework" : "/admin/homework";
      router.push(basePath);
      router.refresh();
    }
    return result;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href={pathname.includes("/teacher") ? "/teacher/homework" : "/admin/homework"}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Back to Homework
      </Link>

      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Assign Homework</h2>
          <p className="text-sm text-gray-500 mt-1">
            Create and distribute new assignments to specific classes.
          </p>
        </div>

        {classState.status === "error" ? (
          <DataState variant="error" title="Classes unavailable" message={classState.error} />
        ) : teacherState.status === "error" ? (
          <DataState variant="error" title="Teachers unavailable" message={teacherState.error} />
        ) : subjectError ? (
          <DataState variant="error" title="Subjects unavailable" message={subjectError} />
        ) : isDependencyLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ) : (
          <HomeworkForm
            onCreate={handleCreate}
            classOptions={classOptions}
            teacherOptions={teacherOptions}
            subjectOptions={subjectOptions}
          />
        )}
      </Card>
    </div>
  );
}
