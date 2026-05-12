"use client";

import { useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Skeleton, DataState } from "../../../components/ui";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { serviceRequest } from "../../../services/service-client";
import { TimetableForm } from "../components/TimetableForm";
import { useTimetable } from "../hooks/useTimetable";
import { TimetableFormInput } from "../types/timetable.types";
import { showToast } from "../../../utils/toast";
import { findTimetableConflicts } from "../utils/conflicts";
import { useSearchParams } from "next/navigation";

export function TimetableCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get("class_id") || undefined;
  const { state: timetableState, addTimetable } = useTimetable();

  const { state: classState, run: runClasses } = useSafeAsync<Array<{ _id: string; name: string }>>();
  const { state: teacherState, run: runTeachers } = useSafeAsync<Array<{ _id: string; name: string }>>();
  const { state: subjectState, run: runSubjects } = useSafeAsync<Array<{ _id: string; name: string }>>();
  // academic year removed: no longer required or fetched

  const loadDependencies = useCallback(() => {
    return Promise.all([
      runClasses(async () => {
        const result = await serviceRequest<Array<{ _id: string; name: string }>>("/api/classes");
        if (!result.ok) throw new Error(result.error?.message || "Failed to load classes");
        return result.data;
      }),
      runTeachers(async () => {
        const result = await serviceRequest<Array<{ _id: string; name: string }>>("/api/teachers");
        if (!result.ok) throw new Error(result.error?.message || "Failed to load teachers");
        return result.data;
      }),
      runSubjects(async () => {
        const result = await serviceRequest<Array<{ _id: string; name: string }>>("/api/subjects");
        if (!result.ok) throw new Error(result.error?.message || "Failed to load subjects");
        return result.data;
      }),
      // academic years not fetched
    ]);
  }, [runClasses, runTeachers, runSubjects]);

  useEffect(() => {
    void loadDependencies().catch(() => { });
  }, [loadDependencies]);

  const isLoading =
    classState.status === "loading" ||
    teacherState.status === "loading" ||
    subjectState.status === "loading" ||
    classState.status === "idle";

  async function handleCreate(input: TimetableFormInput) {
    try {
      const conflicts = findTimetableConflicts(timetableState.data || [], input);
      if (conflicts.length > 0) {
        return {
          ok: false,
          error: { message: "Conflict detected! Same class or same teacher cannot be assigned in the same time slot." }
        };
      }

      const result = await addTimetable(input);
      if (result.ok) {
        showToast("Timetable entry created successfully", "success");
        const destination = input.class_id
          ? `/admin/timetable?class_id=${encodeURIComponent(input.class_id)}`
          : "/admin/timetable";
        router.replace(destination);
      } else {
        showToast(result.error?.message || "Failed to create entry", "error");
      }
      return result;
    } catch (error: any) {
      console.error("[TimetableCreatePage] Error:", error);
      showToast(error.message || "Failed to create entry", "error");
      return { ok: false, error: { message: error.message } };
    }
  }

  if (classState.status === "error" || teacherState.status === "error" || subjectState.status === "error") {
    return (
      <DataState
        variant="error"
        title="Failed to load dependencies"
        message={classState.error || teacherState.error || subjectState.error}
      />
    );
  }

  const classOptions = ((classState.data as any)?.data || classState.data || []).map((o: any) => ({ id: o._id, label: o.name }));
  const teacherOptions = (teacherState.data ?? []).map(o => ({ id: o._id, label: o.name }));
  const subjectOptions = (subjectState.data ?? []).map(o => ({ id: o._id, label: o.name }));
  // academicYearOptions removed

  return (
    <div className="max-w-full mx-auto space-y-6">
      <Link
        href="/admin/timetable"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Back to Timetable
      </Link>

      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Add Timetable Entry</h2>
          <p className="text-sm text-gray-500 mt-1">
            Create a new schedule entry for a class, subject, and teacher.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ) : (
          <TimetableForm
            onSubmit={handleCreate}
            onCancel={() => router.back()}
            classOptions={classOptions}
            teacherOptions={teacherOptions}
            subjectOptions={subjectOptions}
            initialClassId={initialClassId}
            isLoading={isLoading}
          />
        )}
      </Card>
    </div>
  );
}
