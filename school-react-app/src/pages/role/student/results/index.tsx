import { SchoolShell } from "@/layouts/SchoolShell";
import { ResultListPage } from "@/modules/results/pages/ResultListPage";
import { useAuth } from "@/hooks/useAuth";

export function StudentResultsPage() {
    const { user } = useAuth();

    return (
        <SchoolShell eyebrow="Parent Portal" title="Exam Results">
            <ResultListPage filters={user?.studentId ? { student_id: user.studentId } : undefined} />
        </SchoolShell>
    );
}