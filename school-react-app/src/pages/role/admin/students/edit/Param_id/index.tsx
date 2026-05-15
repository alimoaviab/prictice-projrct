import { SchoolShell } from "@/layouts/SchoolShell";
import { StudentEditPage } from "@/modules/students/pages/StudentEditPage";

export function AdminStudentEditPage() {
    return (
        <SchoolShell eyebrow="Operations" title="Edit Student">
            <StudentEditPage />
        </SchoolShell>
    );
}
