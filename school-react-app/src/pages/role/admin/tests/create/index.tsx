import { SchoolShell } from "@/layouts/SchoolShell";
import { TestCreatePage } from "@/modules/tests/pages/TestCreatePage";

export function AdminTestCreatePage() {
    return (
        <SchoolShell eyebrow="Academic" title="Schedule Test">
            <TestCreatePage />
        </SchoolShell>
    );
}
