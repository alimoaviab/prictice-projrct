import { SchoolShell } from "@/layouts/SchoolShell";
import { TestCreatePage } from "@/modules/tests/pages/TestCreatePage";

// No giant page title — TestCreatePage owns its header.
export function AdminTestCreatePage() {
    return (
        <SchoolShell>
            <TestCreatePage />
        </SchoolShell>
    );
}
