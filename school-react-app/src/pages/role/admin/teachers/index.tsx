import { SchoolShell } from "@/layouts/SchoolShell";
import { TeacherListPage } from "@/modules/teachers/pages/TeacherListPage";

export function AdminTeachersPage() {
    return (
        <SchoolShell eyebrow="Operations" title="Teachers">
            <TeacherListPage />
        </SchoolShell>
    );
}
