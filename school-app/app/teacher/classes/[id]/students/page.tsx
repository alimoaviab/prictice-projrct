"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { Badge, Card, DataState, Skeleton } from "../../../../../components/ui";
import { SchoolShell } from "../../../../../layouts/SchoolShell";
import { useSafeAsync } from "../../../../../hooks/useSafeAsync";
import { serviceRequest } from "../../../../../services/service-client";

type StudentsResponse = {
    class: string;
    total_students: number;
    students: Array<{
        id: string;
        name: string;
        roll_no: string;
        email: string;
        status: string;
    }>;
};

export default function TeacherClassStudentsPage() {
    const params = useParams<{ id: string }>();
    const { state, run } = useSafeAsync<StudentsResponse>();

    useEffect(() => {
        void run(async () => {
            const result = await serviceRequest<StudentsResponse>(`/api/school/classes/${params.id}/students`);
            if (!result.ok) {
                throw new Error(result.error.message || "Failed to load students");
            }

            return result.data;
        }).catch(() => {
            // useSafeAsync already captures the error.
        });
    }, [params.id, run]);

    if (state.status === "idle" || state.status === "loading") {
        return (
            <SchoolShell eyebrow="Teacher Portal" title="Class Students">
                <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-44 w-full" />
                </div>
            </SchoolShell>
        );
    }

    if (state.status === "error") {
        return (
            <SchoolShell eyebrow="Teacher Portal" title="Class Students">
                <DataState variant="error" title="Students unavailable" message={state.error} />
            </SchoolShell>
        );
    }

    return (
        <SchoolShell eyebrow="Teacher Portal" title="Class Students">
            <div className="space-y-6">
                <Card>
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">{state.data.class}</h2>
                            <p className="text-sm text-slate-500">{state.data.total_students} students enrolled</p>
                        </div>
                        <Badge variant="secondary">Teacher view</Badge>
                    </div>
                </Card>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {state.data.students.map((student) => (
                        <Card key={student.id} className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="font-bold text-slate-900">{student.name}</h3>
                                    <p className="text-xs text-slate-500">Roll No {student.roll_no}</p>
                                </div>
                                <Badge variant={student.status === "active" ? "success" : "gray"}>{student.status}</Badge>
                            </div>
                            <p className="text-sm text-slate-500">{student.email || "No email recorded"}</p>
                        </Card>
                    ))}
                </div>
            </div>
        </SchoolShell>
    );
}