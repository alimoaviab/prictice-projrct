import { SchoolShell } from "@/layouts/SchoolShell";
import { TimetableCreatePage } from "@/modules/timetable/pages/TimetableCreatePage";

// No giant page title — TimetableCreatePage owns its header.
export function AdminTimetableCreatePage() {
    return (
        <SchoolShell>
            <TimetableCreatePage />
        </SchoolShell>
    );
}
