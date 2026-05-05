"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Badge, Card, DataState, Skeleton } from "../../../components/ui";
import { SchoolShell } from "../../../layouts/SchoolShell";
import { useAuth } from "../../../hooks/useAuth";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { serviceRequest } from "../../../services/service-client";

type TeacherClassesResponse = {
    teacher: { id: string; first_name: string; last_name: string; employee_no: string };
    classes: Array<{
        id: string;
        name: string;
        section: string;
        capacity: number;
        academic_year: string;
        enrolled_students: number;
    }>;
};

export default function TeacherClassesPage() {
    const { user } = useAuth();
    const { state, run } = useSafeAsync<TeacherClassesResponse>();

    useEffect(() => {
        void run(async () => {
            if (!user?.profileId) {
                throw new Error("Teacher profile is missing.");
            }

            const result = await serviceRequest<TeacherClassesResponse>(`/api/teachers/${user.profileId}`);
            if (!result.ok) {
                throw new Error(result.error.message || "Failed to load classes");
            }

            return result.data;
        }).catch(() => {
            // useSafeAsync already captures the error.
        });
    }, [run, user?.profileId]);

    if (state.status === "idle" || state.status === "loading") {
        return (
            <SchoolShell eyebrow="Teacher Portal" title="My Classes">
                <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-44 w-full" />
                </div>
            </SchoolShell>
        );
    }

    if (state.status === "error") {
        return (
            <SchoolShell eyebrow="Teacher Portal" title="My Classes">
                <DataState variant="error" title="Classes unavailable" message={state.error} />
            </SchoolShell>
        );
    }

    return (
        <SchoolShell eyebrow="Teacher Portal" title="My Classes">
            <div className="space-y-6">
                <Card>
                    <h2 className="text-xl font-bold text-slate-900">Assigned classes</h2>
                    <p className="text-sm text-slate-500">Open a class to view students and start daily work.</p>
                </Card>

                <div className="grid gap-4 lg:grid-cols-2">
                    {state.data.classes.map((classItem) => (
                        <Card key={classItem.id} className="space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">{classItem.name}</h3>
                                    <p className="text-sm text-slate-500">{classItem.section || "No section"} · {classItem.academic_year || "Current year"}</p>
                                </div>
                                <Badge variant={classItem.enrolled_students >= classItem.capacity ? "warning" : "secondary"}>
                                    {classItem.enrolled_students}/{classItem.capacity || 0}
                                </Badge>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Link href={`/teacher/classes/${classItem.id}/students`} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800">
                                    View Students
                                </Link>
                                <Link href={`/teacher/attendance/create?class_id=${classItem.id}`} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
                                    Mark Attendance
                                </Link>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </SchoolShell>
    );
}
