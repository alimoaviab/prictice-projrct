import { SchoolShell } from "@/layouts/SchoolShell";
import { TestCreatePage } from "@/modules/tests/pages/TestCreatePage";

export function TeacherTestCreatePage() {
    return (
        <SchoolShell eyebrow="Teacher Portal" title="Schedule New Test">
            <TestCreatePage />
        </SchoolShell>
    );
}
