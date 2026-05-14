import { SchoolShell } from "@/layouts/SchoolShell";
import { TestMarksEntryPage } from "@/modules/tests/pages/TestMarksEntryPage";

export function AdminTestMarksPage() {
    return (
        <SchoolShell eyebrow="Academic" title="Test Marks">
            <TestMarksEntryPage role="ADMIN" />
        </SchoolShell>
    );
}
