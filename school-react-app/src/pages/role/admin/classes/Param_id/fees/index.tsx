import { ClassFeesPage } from "@/modules/classes/pages/ClassFeesPage";
import { SchoolShell } from "@/layouts/SchoolShell";

export function Page() {
    return (
        <SchoolShell 
            title="Class Fee Structure" 
            eyebrow="Finance & Billing"
            description="Manage recurring monthly tuition and one-time institutional charges at the class level."
        >
            <ClassFeesPage />
        </SchoolShell>
    );
}
