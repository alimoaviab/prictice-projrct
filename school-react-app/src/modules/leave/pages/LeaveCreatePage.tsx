/**
 * Leave request create page rebuilt on the Academic Year design system.
 */

import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import LeaveForm from "../components/LeaveForm";
import { useLeave } from "../hooks/useLeave";
import { LeaveFormInput } from "../types/leave.types";
import { showToast } from "@/utils/toast";
import { bindRefresh } from "@/services/data-bus";

export function LeaveCreatePage() {
  const navigate = useNavigate();
  const { addLeave } = useLeave();

  const { state: studentState, run: runStudents } = useSafeAsync<
    Array<{ _id: string; name: string }>
  >();
  const { state: teacherState, run: runTeachers } = useSafeAsync<
    Array<{ _id: string; name: string }>
  >();

  const loadStudents = useCallback(() => {
    return runStudents(async () => {
      const result = await serviceRequest<any>("/api/students");
      if (!result.ok) throw new Error(result.error.message || "Failed to load students");
      const data: any = result.data;
      const arr = Array.isArray(data) ? data : data?.data ?? [];
      return arr.map((s: any) => ({
        _id: s._id,
        name:
          s.name || `${s.first_name || ""} ${s.last_name || ""}`.trim() || s.admission_no || s._id,
      }));
    });
  }, [runStudents]);

  const loadTeachers = useCallback(() => {
    return runTeachers(async () => {
      const result = await serviceRequest<any>("/api/teachers");
      if (!result.ok) throw new Error(result.error.message || "Failed to load teachers");
      const arr: any[] = Array.isArray(result.data) ? result.data : (result.data as any)?.data ?? [];
      return arr.map((t: any) => ({
        _id: t._id,
        name:
          t.name || `${t.first_name || ""} ${t.last_name || ""}`.trim() || t.email || t._id,
      }));
    });
  }, [runTeachers]);

  useEffect(() => {
    void loadStudents().catch(() => {});
    void loadTeachers().catch(() => {});
    const offStudents = bindRefresh("students", loadStudents);
    const offTeachers = bindRefresh("teachers", loadTeachers);
    return () => {
      offStudents();
      offTeachers();
    };
  }, [loadStudents, loadTeachers]);

  const isLoading =
    studentState.status === "loading" ||
    teacherState.status === "loading" ||
    studentState.status === "idle";

  const students = (studentState.data ?? []).map((s) => ({
    _id: s._id,
    name: s.name + " (Student)",
  }));
  const teachers = (teacherState.data ?? []).map((t) => ({
    _id: t._id,
    name: t.name + " (Teacher)",
  }));
  const requesters = [...students, ...teachers];

  async function handleCreate(input: LeaveFormInput) {
    const result = await addLeave(input);
    if (result.ok) {
      showToast("Leave request submitted successfully", "success");
      navigate("/admin/leave");
    } else {
      showToast(result.error.message || "Failed to submit request", "error");
    }
    return result;
  }

  if (studentState.status === "error" || teacherState.status === "error") {
    return (
      <DataState
        variant="error"
        title="Failed to load dependencies"
        message={studentState.error || teacherState.error}
      />
    );
  }

  return (
    <EntityCreateLayout
      backTo="/admin/leave"
      backLabel="Return to Leave Management"
      eyebrow="Absence Workflow"
      icon="event_busy"
      title="New Leave Request"
      subtitle="Submit a leave request on behalf of a student or staff member."
      asideTitle="Request Intelligence"
      aside={
        <>
          <GuidanceSection title="Who can be the requester?">
            Either a student or a teacher. The dropdown filters automatically based on the requester
            type you select.
          </GuidanceSection>
          <GuidanceSection title="Approval Flow">
            <GuidanceCallout tone="blue">
              Submitted requests go to "Pending". An admin can approve, reject (with a reason), or
              cancel them from the leave list.
            </GuidanceCallout>
          </GuidanceSection>
          <GuidanceChecklist
            items={[
              { done: requesters.length > 0, label: "Requesters available" },
              { done: true, label: "Dates picked" },
              { done: true, label: "Reason provided" },
            ]}
          />
        </>
      }
    >
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-11 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : (
        <LeaveForm
          onSubmit={handleCreate}
          onCancel={() => navigate("/admin/leave")}
          requesters={requesters}
        />
      )}
    </EntityCreateLayout>
  );
}
