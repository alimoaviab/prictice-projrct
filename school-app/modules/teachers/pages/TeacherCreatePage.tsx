"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Skeleton, DataState } from "../../../components/ui";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { serviceRequest } from "../../../services/service-client";
import { TeacherForm } from "../components/TeacherForm";
import { useTeachers } from "../hooks/useTeachers";
import { TeacherFormInput } from "../types/teacher.types";
import { showToast } from "../../../utils/toast";

export function TeacherCreatePage() {
  const router = useRouter();
  const { addTeacher } = useTeachers();
  const { state: classState, run } = useSafeAsync<Array<{ _id: string; name: string }>>();

  const loadClasses = useCallback(() => {
    return run(async () => {
      const result = await serviceRequest<Array<{ _id: string; name: string }>>("/api/classes");
      if (!result.ok) {
        throw new Error(result.error.message || "Failed to load classes");
      }
      return result.data;
    });
  }, [run]);

  useEffect(() => {
    void loadClasses().catch(() => {});
  }, [loadClasses]);

  const isClassDependencyLoading = classState.status === "idle" || classState.status === "loading";
  const classOptions = (classState.data ?? []).map((item) => ({ id: item._id, label: item.name }));

  async function handleCreate(input: TeacherFormInput) {
    const result = await addTeacher(input);
    if (result && (result as { ok?: boolean }).ok !== false) {
      showToast("Teacher added successfully", "success");
      router.push("/admin/teachers");
      router.refresh();
    }
    return result;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/admin/teachers"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Back to Teachers
      </Link>

      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Add New Teacher</h2>
          <p className="text-sm text-gray-500 mt-1">
            Register a new teaching staff member.
          </p>
        </div>

        {classState.status === "error" ? (
          <DataState variant="error" title="Failed to load classes" message={classState.error} />
        ) : isClassDependencyLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ) : (
          <TeacherForm onCreate={handleCreate} classOptions={classOptions} />
        )}
      </Card>
    </div>
  );
}
