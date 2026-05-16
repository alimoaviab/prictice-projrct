import { SchoolShell } from "@/layouts/SchoolShell";
import { TeacherEditPage } from "@/modules/teachers/pages/TeacherEditPage";

// No giant page title — TeacherEditPage owns its header.
export function AdminTeacherEditPage() {
    return (
        <SchoolShell>
            <TeacherEditPage />
        </SchoolShell>
    );
}
