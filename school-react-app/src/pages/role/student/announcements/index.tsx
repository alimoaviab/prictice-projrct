import { useEffect } from "react";
import { Badge, Card, DataState, Skeleton } from "@/components/ui";
import { SchoolShell } from "@/layouts/SchoolShell";
import { useAuth } from "@/hooks/useAuth";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";

type AnnouncementsResponse = {
    student: string;
    announcements: Array<{
        id: string;
        title: string;
        content: string;
        posted_date: string;
        posted_by: string;
        priority: string;
        category: string;
    }>;
};

async function resolveStudentId(studentId?: string) {
    if (studentId) return studentId;
    const result = await serviceRequest<{ students: Array<{ id: string }> }>("/api/parent/student-info");
    return result.ok ? result.data.students?.[0]?.id ?? "" : "";
}

export function StudentAnnouncementsPage() {
    const { user } = useAuth();
    const { state, run } = useSafeAsync<AnnouncementsResponse>();

    useEffect(() => {
        void run(async () => {
            const studentId = await resolveStudentId(user?.studentId);
            if (!studentId) throw new Error("No linked student found.");

            const result = await serviceRequest<AnnouncementsResponse>(`/api/parent/child/announcements?student_id=${studentId}`);
            if (!result.ok) throw new Error(result.error.message || "Failed to load announcements");
            return result.data;
        }).catch(() => {
            // handled by useSafeAsync
        });
    }, [run, user?.studentId]);

    if (state.status === "idle" || state.status === "loading") {
        return (
            <SchoolShell eyebrow="Parent Portal" title="Announcements">
                <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-44 w-full" />
                </div>
            </SchoolShell>
        );
    }

    if (state.status === "error") {
        return (
            <SchoolShell eyebrow="Parent Portal" title="Announcements">
                <DataState variant="error" title="Announcements unavailable" message={state.error} />
            </SchoolShell>
        );
    }

    return (
        <SchoolShell eyebrow="Parent Portal" title="Announcements">
            <div className="space-y-4">
                {state.data.announcements.map((announcement) => (
                    <Card key={announcement.id} className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{announcement.title}</h3>
                                <p className="text-sm text-slate-500">{announcement.posted_by} · {announcement.posted_date}</p>
                            </div>
                            <Badge variant={announcement.priority === "high" ? "error" : "secondary"}>{announcement.priority}</Badge>
                        </div>
                        <p className="text-sm text-slate-600">{announcement.content}</p>
                    </Card>
                ))}
            </div>
        </SchoolShell>
    );
}