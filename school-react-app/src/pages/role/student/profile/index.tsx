import { useEffect } from "react";
import { Badge, Card, DataState, Skeleton } from "@/components/ui";
import { SchoolShell } from "@/layouts/SchoolShell";
import { useAuth } from "@/hooks/useAuth";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";

type ProfileResponse = {
    student: {
        id: string;
        name: string;
        roll_no: string;
        email: string;
        phone: string;
        date_of_birth: string | null;
        class: string;
        section: string;
        academic_year: string;
        status: string;
    };
    guardian: {
        name: string;
        relationship: string;
        phone: string;
        email: string;
    };
    enrolled_subjects: Array<{ id: string; name: string; code?: string }>;
};

async function resolveStudentId(studentId?: string) {
    if (studentId) return studentId;
    const result = await serviceRequest<{ students: Array<{ id: string }> }>("/api/parent/student-info");
    return result.ok ? result.data.students?.[0]?.id ?? "" : "";
}

export function StudentProfilePage() {
    const { user } = useAuth();
    const { state, run } = useSafeAsync<ProfileResponse>();

    useEffect(() => {
        void run(async () => {
            const studentId = await resolveStudentId(user?.studentId);
            if (!studentId) throw new Error("No linked student found.");

            const result = await serviceRequest<ProfileResponse>(`/api/parent/student-info?student_id=${studentId}`);
            if (!result.ok) throw new Error(result.error.message || "Failed to load profile");
            return result.data;
        }).catch(() => {
            // handled by useSafeAsync
        });
    }, [run, user?.studentId]);

    if (state.status === "idle" || state.status === "loading") {
        return (
            <SchoolShell eyebrow="Parent Portal" title="Child Profile">
                <div className="space-y-4">
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-44 w-full" />
                </div>
            </SchoolShell>
        );
    }

    if (state.status === "error") {
        return (
            <SchoolShell eyebrow="Parent Portal" title="Child Profile">
                <DataState variant="error" title="Profile unavailable" message={state.error} />
            </SchoolShell>
        );
    }

    const profile = state.data;

    return (
        <SchoolShell eyebrow="Parent Portal" title="Child Profile">
            <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                <Card>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Student</p>
                            <h2 className="mt-1 text-3xl font-bold text-slate-900">{profile.student.name}</h2>
                            <p className="mt-2 text-sm text-slate-500">{profile.student.class} {profile.student.section ? `- ${profile.student.section}` : ""}</p>
                        </div>
                        <Badge variant="success">{profile.student.status}</Badge>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        {[
                            ["Roll No", profile.student.roll_no],
                            ["Academic Year", profile.student.academic_year],
                            ["Email", profile.student.email],
                            ["Phone", profile.student.phone || "—"],
                            ["Date of Birth", profile.student.date_of_birth || "—"]
                        ].map(([label, value]) => (
                            <div key={label as string} className="rounded-2xl border border-slate-200 p-4">
                                <p className="text-xs font-semibold normal-case tracking-wide text-slate-400">{label}</p>
                                <p className="mt-1 font-semibold text-slate-900">{value}</p>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card>
                    <h3 className="text-lg font-bold text-slate-900">Guardian</h3>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                        <p><span className="font-semibold text-slate-900">Name:</span> {profile.guardian.name || "—"}</p>
                        <p><span className="font-semibold text-slate-900">Relationship:</span> {profile.guardian.relationship}</p>
                        <p><span className="font-semibold text-slate-900">Phone:</span> {profile.guardian.phone || "—"}</p>
                        <p><span className="font-semibold text-slate-900">Email:</span> {profile.guardian.email || "—"}</p>
                    </div>

                    <h3 className="mt-6 text-lg font-bold text-slate-900">Enrolled subjects</h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {profile.enrolled_subjects.length ? profile.enrolled_subjects.map((subject) => (
                            <Badge key={subject.id} variant="secondary">
                                {subject.code ? `${subject.code} · ${subject.name}` : subject.name}
                            </Badge>
                        )) : <p className="text-sm text-slate-500">No subjects assigned yet.</p>}
                    </div>
                </Card>
            </div>
        </SchoolShell>
    );
}