"use client";

import { useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Skeleton, DataState } from "../../../components/ui";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { serviceRequest } from "../../../services/service-client";
import LeaveForm from "../components/LeaveForm";
import { useLeave } from "../hooks/useLeave";
import { LeaveFormInput } from "../types/leave.types";
import { showToast } from "../../../utils/toast";

export function LeaveCreatePage() {
  const router = useRouter();
  const { addLeave } = useLeave();

  const { state: studentState, run: runStudents } = useSafeAsync<Array<{ _id: string; name: string }>>();
  const { state: teacherState, run: runTeachers } = useSafeAsync<Array<{ _id: string; name: string }>>();

  const loadDependencies = useCallback(() => {
    return Promise.all([
      runStudents(async () => {
        const result = await serviceRequest<Array<{ _id: string; name: string }>>("/api/students");
        if (!result.ok) throw new Error(result.error.message || "Failed to load students");
        return result.data;
      }),
      runTeachers(async () => {
        const result = await serviceRequest<Array<{ _id: string; name: string }>>("/api/teachers");
        if (!result.ok) throw new Error(result.error.message || "Failed to load teachers");
        return result.data;
      })
    ]);
  }, [runStudents, runTeachers]);

  useEffect(() => {
    void loadDependencies().catch(() => {});
  }, [loadDependencies]);

  const isLoading = studentState.status === "loading" || teacherState.status === "loading" || studentState.status === "idle";

  const students = (studentState.data ?? []).map(s => ({ _id: s._id, name: s.name + " (Student)" }));
  const teachers = (teacherState.data ?? []).map(t => ({ _id: t._id, name: t.name + " (Teacher)" }));
  const requesters = [...students, ...teachers];

  async function handleCreate(input: LeaveFormInput) {
    const result = await addLeave(input);
    if (result.ok) {
      showToast("Leave request submitted successfully", "success");
      router.push("/admin/leave");
      router.refresh();
    } else {
      showToast(result.error.message || "Failed to submit request", "error");
    }
    return result;
  }

  if (studentState.status === "error" || teacherState.status === "error") {
    return <DataState variant="error" title="Failed to load dependencies" message={studentState.error || teacherState.error} />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/admin/leave"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Back to Leave Management
      </Link>

      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">New Leave Request</h2>
          <p className="text-sm text-gray-500 mt-1">
            Submit a new leave request for a student or staff member.
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
          <LeaveForm
            onSubmit={handleCreate}
            onCancel={() => router.push("/admin/leave")}
            requesters={requesters}
          />
        )}
      </Card>
    </div>
  );
}
