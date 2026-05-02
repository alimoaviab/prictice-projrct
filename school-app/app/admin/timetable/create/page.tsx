import { SchoolShell } from "../../../../layouts/SchoolShell";
import { TimetableCreatePage } from "../../../../modules/timetable/pages/TimetableCreatePage";

export default function AdminTimetableCreatePage() {
    return (
        <SchoolShell eyebrow="Academic" title="Add Timetable Entry">
            <TimetableCreatePage />
        </SchoolShell>
    );
}
