import { SchoolShell } from "@/layouts/SchoolShell";
import { BehaviorCreatePage } from "@/modules/behavior/pages/BehaviorCreatePage";

export function AdminBehaviorCreatePage() {
    return (
        <SchoolShell eyebrow="Operations" title="New Behavior Record">
            <BehaviorCreatePage />
        </SchoolShell>
    );
}
