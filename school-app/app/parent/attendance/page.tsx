"use client";

import { useEffect } from "react";
import { SchoolShell } from "../../../layouts/SchoolShell";
import { Card, DataState, Skeleton, Badge } from "../../../components/ui";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { getParentAttendance } from "../../../modules/attendance/services/attendance.service";
import { ParentAttendanceReport } from "../../../modules/attendance/types/attendance.types";

export default function ParentAttendancePage() {
  const { state, run } = useSafeAsync<ParentAttendanceReport>();

  useEffect(() => {
    void run(async () => {
      const result = await getParentAttendance();
      if (!result.ok) {
        throw new Error(result.error.message || "Failed to load attendance summary");
      }

      return result.data;
    }).catch(() => {
      // useSafeAsync already captures the error.
    });
  }, [run]);

  if (state.status === "loading" || state.status === "idle") {
    return (
      <SchoolShell eyebrow="Parent Dashboard" title="Child's Attendance">
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </SchoolShell>
    );
  }

  if (state.status === "error") {
    return (
      <SchoolShell eyebrow="Parent Dashboard" title="Child's Attendance">
        <DataState variant="error" title="Attendance unavailable" message={state.error} />
      </SchoolShell>
    );
  }

  if (state.status === "empty" || !state.data?.students?.length) {
    return (
      <SchoolShell eyebrow="Parent Dashboard" title="Child's Attendance">
        <DataState
          variant="empty"
          title="No attendance records"
          message="We could not find any children linked to this parent account yet."
        />
      </SchoolShell>
    );
  }

  return (
    <SchoolShell eyebrow="Parent Dashboard" title="Child's Attendance">
      <div className="space-y-6">
        {state.data.students.map((student) => (
          <Card key={student.student_id} className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{student.student_name}</h2>
                <p className="text-sm text-slate-500">{student.class_name}</p>
              </div>
              <Badge variant={student.percentage >= 75 ? "success" : student.percentage >= 50 ? "warning" : "error"}>
                {student.percentage}% attendance
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-emerald-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Present</p>
                <p className="mt-1 text-2xl font-bold text-emerald-900">{student.total_present}</p>
              </div>
              <div className="rounded-2xl bg-rose-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-rose-700">Absent</p>
                <p className="mt-1 text-2xl font-bold text-rose-900">{student.total_absent}</p>
              </div>
              <div className="rounded-2xl bg-slate-100 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-600">Excused</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{student.total_excused}</p>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-slate-800">Recent records</p>
              <div className="space-y-2">
                {student.recent_records.map((record) => (
                  <div key={`${student.student_id}-${record.date}`} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                    <span className="text-sm font-medium text-slate-700">{record.date}</span>
                    <Badge
                      variant={record.status === "present" ? "success" : record.status === "absent" ? "error" : record.status === "late" ? "warning" : "secondary"}
                      className="capitalize"
                    >
                      {record.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </SchoolShell>
  );
}
