import { SchoolShell } from "@/layouts/SchoolShell";
import { LiveClassCreatePage } from "@/modules/live-classes/pages/LiveClassCreatePage";

export function TeacherLiveClassCreatePage() {
    return (
        <SchoolShell title="Schedule Live Class" eyebrow="Teacher">
            <LiveClassCreatePage role="TEACHER" />
        </SchoolShell>
    );
}
