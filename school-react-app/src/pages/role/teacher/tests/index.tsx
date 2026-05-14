import { SchoolShell } from "@/layouts/SchoolShell";
import { TestListPage } from "@/modules/tests/pages/TestListPage";

export function TeacherTestsPage() {
    return (
        <SchoolShell eyebrow="Teacher Portal" title="My Tests">
            <TestListPage />
        </SchoolShell>
    );
}
