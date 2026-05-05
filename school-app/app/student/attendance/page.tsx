"use client";

import { useEffect } from "react";
import { Badge, Card, DataState, Skeleton } from "../../../components/ui";
import { SchoolShell } from "../../../layouts/SchoolShell";
import { useAuth } from "../../../hooks/useAuth";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { serviceRequest } from "../../../services/service-client";

type AttendanceResponse = {
    student: string;
    class: string;
    academic_year: string;
    attendance_summary: {
        total_working_days: number;
        present_days: number;
        absent_days: number;
        leave_days: number;
        attendance_percentage: number;
        status: string;
    };
    recent_records: Array<{ date: string; status: string }>;
    monthly_breakdown: Record<string, { working_days: number; present: number; absent: number; leave: number; percentage: number }>;
};

async function resolveStudentId(studentId?: string) {
    if (studentId) return studentId;
    const result = await serviceRequest<{ students: Array<{ id: string }> }>("/api/parent/student-info");
    return result.ok ? result.data.students?.[0]?.id ?? "" : "";
}

export default function StudentAttendancePage() {
    const { user } = useAuth();
    const { state, run } = useSafeAsync<AttendanceResponse>();

    useEffect(() => {
        void run(async () => {
            const studentId = await resolveStudentId(user?.studentId);
            if (!studentId) throw new Error("No linked student found.");

            const result = await serviceRequest<AttendanceResponse>(`/api/parent/student-attendance?student_id=${studentId}`);
            if (!result.ok) throw new Error(result.error.message || "Failed to load attendance");
            return result.data;
        }).catch(() => {
            // handled by useSafeAsync
        });
    }, [run, user?.studentId]);

    if (state.status === "idle" || state.status === "loading") {
        return (
            <SchoolShell eyebrow="Student Portal" title="Attendance">
                <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-44 w-full" />
                </div>
            </SchoolShell>
        );
    }

    if (state.status === "error") {
        return (
            <SchoolShell eyebrow="Student Portal" title="Attendance">
                <DataState variant="error" title="Attendance unavailable" message={state.error} />
            </SchoolShell>
        );
    }

    const report = state.data;

    return (
        <SchoolShell eyebrow="Student Portal" title="Attendance">
            <div className="space-y-6">
                <Card>
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">{report.student}</h2>
                            <p className="text-sm text-slate-500">{report.class} · {report.academic_year}</p>
                        </div>
                        <Badge variant={report.attendance_summary.attendance_percentage >= 90 ? "success" : report.attendance_summary.attendance_percentage >= 75 ? "warning" : "error"}>
                            {report.attendance_summary.attendance_percentage}% attendance
                        </Badge>
                    </div>
                    <div className="mt-6 grid gap-3 md:grid-cols-4">
                        {[
                            ["Working Days", report.attendance_summary.total_working_days],
                            ["Present", report.attendance_summary.present_days],
                            ["Absent", report.attendance_summary.absent_days],
                            ["Leave", report.attendance_summary.leave_days]
                        ].map(([label, value]) => (
                            <div key={label as string} className="rounded-2xl border border-slate-200 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                                <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="grid gap-6 xl:grid-cols-2">
                    <Card>
                        <h3 className="text-lg font-bold text-slate-900">Recent records</h3>
                        <div className="mt-4 space-y-3">
                            {report.recent_records.map((record) => (
                                <div key={record.date} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                                    <span className="text-sm font-medium text-slate-700">{record.date}</span>
                                    <Badge variant={record.status === "present" ? "success" : record.status === "late" ? "warning" : record.status === "excused" ? "secondary" : "error"}>
                                        {record.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card>
                        <h3 className="text-lg font-bold text-slate-900">Monthly summary</h3>
                        <div className="mt-4 space-y-3">
                            {Object.entries(report.monthly_breakdown || {}).map(([month, summary]) => (
                                <div key={month} className="rounded-2xl border border-slate-200 p-4">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold text-slate-900">{month}</p>
                                        <Badge variant="primary">{summary.percentage}%</Badge>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Working {summary.working_days}, Present {summary.present}, Absent {summary.absent}, Leave {summary.leave}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </SchoolShell>
    );
}