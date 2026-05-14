import { SchoolShell } from "@/layouts/SchoolShell";
import { TestListPage } from "@/modules/tests/pages/TestListPage";

export function AdminTestsPage() {
    return (
        <SchoolShell eyebrow="Academic" title="Tests">
            <TestListPage />
        </SchoolShell>
    );
}
