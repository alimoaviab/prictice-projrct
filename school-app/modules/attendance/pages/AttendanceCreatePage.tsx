"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect } from "react";
import { Card, Skeleton, DataState } from "../../../components/ui";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { serviceRequest } from "../../../services/service-client";
import { AttendanceForm } from "../components/AttendanceForm";
import { useAttendance } from "../hooks/useAttendance";
import { AttendanceFormInput } from "../types/attendance.types";
import { showToast } from "../../../utils/toast";

export function AttendanceCreatePage() {
  const router = useRouter();
  const { addAttendance } = useAttendance();
  const { state: classState, run: runClasses } = useSafeAsync<Array<{ _id: string; name: string }>>();
  const { state: studentState, run: runStudents } = useSafeAsync<
    Array<{ _id: string; first_name: string; last_name: string; admission_no: string; class_id: string }>
  >();

  const loadClasses = useCallback(() => {
    return runClasses(async () => {
      const result = await serviceRequest<Array<{ _id: string; name: string }>>("/api/classes");
      if (!result.ok) throw new Error(result.error.message || "Failed to load classes");
      return result.data;
    });
  }, [runClasses]);

  const loadStudents = useCallback(() => {
    return runStudents(async () => {
      const result = await serviceRequest<
        Array<{ _id: string; first_name: string; last_name: string; admission_no: string; class_id: string }>
      >("/api/students");
      if (!result.ok) throw new Error(result.error.message || "Failed to load students");
      return result.data;
    });
  }, [runStudents]);

  useEffect(() => {
    void loadClasses().catch(() => {});
    void loadStudents().catch(() => {});
  }, [loadClasses, loadStudents]);

  const isDependencyLoading =
    classState.status === "idle" ||
    classState.status === "loading" ||
    studentState.status === "idle" ||
    studentState.status === "loading";

  const classOptions = (classState.data ?? []).map((item) => ({ id: item._id, label: item.name }));
  const studentOptions = (studentState.data ?? []).map((item) => ({
    id: item._id,
    class_id: item.class_id,
    label: `${item.admission_no} - ${item.first_name} ${item.last_name}`.trim(),
  }));

  async function handleCreate(input: AttendanceFormInput) {
    const result = await addAttendance(input);
    if (result && (result as { ok?: boolean }).ok !== false) {
      showToast("Attendance recorded successfully", "success");
      router.push("/admin/attendance");
      router.refresh();
    }
    return result;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/admin/attendance"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Back to Attendance
      </Link>

      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Mark Attendance</h2>
          <p className="text-sm text-gray-500 mt-1">
            Record daily attendance for students in their respective classes.
          </p>
        </div>

        {classState.status === "error" ? (
          <DataState variant="error" title="Classes unavailable" message={classState.error} />
        ) : studentState.status === "error" ? (
          <DataState variant="error" title="Students unavailable" message={studentState.error} />
        ) : isDependencyLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ) : (
          <AttendanceForm
            onCreate={handleCreate}
            classOptions={classOptions}
            studentOptions={studentOptions}
          />
        )}
      </Card>
    </div>
  );
}
