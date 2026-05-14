import { SchoolShell } from "@/layouts/SchoolShell";
import { ExamListPage } from "@/modules/exams/pages/ExamListPage";

export function AdminExamsPage() {
    return (
        <SchoolShell eyebrow="Academic" title="Exams">
            <ExamListPage />
        </SchoolShell>
    );
}
