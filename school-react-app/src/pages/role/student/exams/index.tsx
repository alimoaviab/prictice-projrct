import { SchoolShell } from "@/layouts/SchoolShell";
import { ExamListPage } from "@/modules/exams/pages/ExamListPage";
import { useAuth } from "@/hooks/useAuth";

export function StudentExamsPage() {
    const { user } = useAuth();

    return (
        <SchoolShell eyebrow="Parent Portal" title="Exams">
            <ExamListPage filters={user?.classId ? { class_id: user.classId } : undefined} />
        </SchoolShell>
    );
}