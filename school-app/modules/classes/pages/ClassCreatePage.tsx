"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Skeleton, DataState } from "../../../components/ui";
import { useAcademicYears } from "../../academicYear/hooks/useAcademicYears";
import { useTeachers } from "../../teachers/hooks/useTeachers";
import { ClassForm } from "../components/ClassForm";
import { useClasses } from "../hooks/useClasses";
import { ClassFormInput } from "../types/class.types";
import { showToast } from "../../../utils/toast";

export function ClassCreatePage() {
  const router = useRouter();
  const { addClass } = useClasses();
  const { state: academicYearState } = useAcademicYears();
  const { state: teacherState } = useTeachers();

  const isDependencyLoading =
    academicYearState.status === "idle" ||
    academicYearState.status === "loading" ||
    teacherState.status === "idle" ||
    teacherState.status === "loading";

  const hasAcademicYears = (academicYearState.data ?? []).length > 0;

  const academyCareOptions = (academicYearState.data ?? []).map((item) => ({
    id: item._id,
    label: item.year,
  }));

  const teacherOptions = (teacherState.data ?? []).map((item) => ({
    id: item._id,
    label: `${item.first_name} ${item.last_name}`.trim(),
  }));

  async function handleCreate(input: ClassFormInput) {
    const result = await addClass(input);
    if (result && (result as { ok?: boolean }).ok !== false) {
      showToast("Class created successfully", "success");
      router.push("/admin/classes");
      router.refresh();
    }
    return result;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/admin/classes"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Back to Classes
      </Link>

      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Create New Class</h2>
          <p className="text-sm text-gray-500 mt-1">
            Set up a new classroom and assign teachers and subjects.
          </p>
        </div>

        {academicYearState.status === "error" ? (
          <DataState variant="error" title="Academic years unavailable" message={academicYearState.error} />
        ) : teacherState.status === "error" ? (
          <DataState variant="error" title="Teachers unavailable" message={teacherState.error} />
        ) : !isDependencyLoading && !hasAcademicYears ? (
          <DataState
            variant="empty"
            title="Create an academic year first"
            message="You need at least one academic year before creating classes."
          />
        ) : isDependencyLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ) : (
          <ClassForm
            onCreate={handleCreate}
            academyCareOptions={academyCareOptions}
            teacherOptions={teacherOptions}
          />
        )}
      </Card>
    </div>
  );
}
