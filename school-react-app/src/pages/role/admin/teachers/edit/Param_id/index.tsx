import { SchoolShell } from "@/layouts/SchoolShell";
import { TeacherEditPage } from "@/modules/teachers/pages/TeacherEditPage";

export function AdminTeacherEditPage() {
    return (
        <SchoolShell eyebrow="Operations" title="Edit Teacher">
            <TeacherEditPage />
        </SchoolShell>
    );
}
