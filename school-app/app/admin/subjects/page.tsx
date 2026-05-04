import { SubjectListPage } from "@/modules/subjects/pages/SubjectListPage";
import { SchoolShell } from "@/layouts/SchoolShell";

export default function SubjectsPage() {
    return (
        <SchoolShell eyebrow="Academic" title="Subjects">
            <SubjectListPage />
        </SchoolShell>
    );
}
