"use client";

import { useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Skeleton, DataState } from "../../../components/ui";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { serviceRequest } from "../../../services/service-client";
import { StudentForm } from "../components/StudentForm";
import { useStudents } from "../hooks/useStudents";
import { StudentFormInput } from "../types/student.types";
import { showToast } from "../../../utils/toast";

export function StudentCreatePage() {
  const router = useRouter();
  const { addStudent } = useStudents();
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

  async function handleCreate(input: StudentFormInput) {
    const result = await addStudent(input);
    if (result && (result as { ok?: boolean }).ok !== false) {
      showToast("Student enrolled successfully", "success");
      router.push("/admin/students");
      router.refresh();
    }
    return result;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/admin/students"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Back to Students
      </Link>

      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">New Student Admission</h2>
          <p className="text-sm text-gray-500 mt-1">
            Enter details to enroll a new student into the system.
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
          <StudentForm onCreate={handleCreate} classOptions={classOptions} />
        )}
      </Card>
    </div>
  );
}
