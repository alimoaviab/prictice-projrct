import { SchoolShell } from "../../../layouts/SchoolShell";
import { ExamListPage } from "../../../modules/exams/pages/ExamListPage";

export default function AdminExamsPage() {
    return (
        <SchoolShell eyebrow="Academic" title="Exams">
            <ExamListPage />
        </SchoolShell>
    );
}
