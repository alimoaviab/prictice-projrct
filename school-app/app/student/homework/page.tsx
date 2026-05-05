"use client";

import { useEffect } from "react";
import { Badge, Card, DataState, Skeleton } from "../../../components/ui";
import { SchoolShell } from "../../../layouts/SchoolShell";
import { useAuth } from "../../../hooks/useAuth";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { serviceRequest } from "../../../services/service-client";

type HomeworkResponse = {
    student: string;
    homework_list: Array<{
        id: string;
        title: string;
        subject: string;
        posted_by: string;
        posted_date: string;
        due_date: string;
        status: string;
        description: string;
        attachments: string[];
        submission_status: string;
        submission_date: string | null;
    }>;
    summary: { total_assignments: number; pending: number; completed: number; overdue: number };
};

async function resolveStudentId(studentId?: string) {
    if (studentId) return studentId;
    const result = await serviceRequest<{ students: Array<{ id: string }> }>("/api/parent/student-info");
    return result.ok ? result.data.students?.[0]?.id ?? "" : "";
}

export default function StudentHomeworkPage() {
    const { user } = useAuth();
    const { state, run } = useSafeAsync<HomeworkResponse>();

    useEffect(() => {
        void run(async () => {
            const studentId = await resolveStudentId(user?.studentId);
            if (!studentId) throw new Error("No linked student found.");

            const result = await serviceRequest<HomeworkResponse>(`/api/parent/child/homework?student_id=${studentId}`);
            if (!result.ok) throw new Error(result.error.message || "Failed to load homework");
            return result.data;
        }).catch(() => {
            // handled by useSafeAsync
        });
    }, [run, user?.studentId]);

    if (state.status === "idle" || state.status === "loading") {
        return (
            <SchoolShell eyebrow="Student Portal" title="Homework">
                <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-44 w-full" />
                </div>
            </SchoolShell>
        );
    }

    if (state.status === "error") {
        return (
            <SchoolShell eyebrow="Student Portal" title="Homework">
                <DataState variant="error" title="Homework unavailable" message={state.error} />
            </SchoolShell>
        );
    }

    const report = state.data;

    return (
        <SchoolShell eyebrow="Student Portal" title="Homework">
            <div className="space-y-6">
                <Card>
                    <div className="grid gap-3 md:grid-cols-4">
                        {[
                            ["Total", report.summary.total_assignments],
                            ["Pending", report.summary.pending],
                            ["Completed", report.summary.completed],
                            ["Overdue", report.summary.overdue]
                        ].map(([label, value]) => (
                            <div key={label as string} className="rounded-2xl border border-slate-200 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                                <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="grid gap-4 lg:grid-cols-2">
                    {report.homework_list.map((item) => (
                        <Card key={item.id} className="space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                                    <p className="text-sm text-slate-500">{item.subject} · {item.posted_by}</p>
                                </div>
                                <Badge variant={item.status === "overdue" ? "error" : item.submission_status === "submitted" ? "success" : "warning"}>
                                    {item.status}
                                </Badge>
                            </div>
                            <p className="text-sm text-slate-600">{item.description || "No instructions provided."}</p>
                            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                                <span>Posted {item.posted_date}</span>
                                <span>Due {item.due_date}</span>
                                {item.submission_date && <span>Submitted {item.submission_date}</span>}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </SchoolShell>
    );
}