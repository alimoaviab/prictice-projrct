import { SchoolShell } from "@/layouts/SchoolShell";
import { ClassCreatePage } from "@/modules/classes/pages/ClassCreatePage";

// No giant page title — the create page renders its own compact header.
export function AdminClassCreatePage() {
    return (
        <SchoolShell>
            <ClassCreatePage />
        </SchoolShell>
    );
}
