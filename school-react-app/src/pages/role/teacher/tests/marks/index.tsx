import { SchoolShell } from "@/layouts/SchoolShell";
import { TestMarksEntryPage } from "@/modules/tests/pages/TestMarksEntryPage";

export function TeacherTestMarksPage() {
    return (
        <SchoolShell eyebrow="Teacher Portal" title="Enter Test Marks">
            <TestMarksEntryPage role="TEACHER" />
        </SchoolShell>
    );
}
