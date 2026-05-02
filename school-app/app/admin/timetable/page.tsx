import { SchoolShell } from "../../../layouts/SchoolShell";
import { TimetableListPage } from "../../../modules/timetable/pages/TimetableListPage";

export default function AdminTimetablePage() {
    return (
        <SchoolShell eyebrow="Academic" title="Timetable">
            <TimetableListPage />
        </SchoolShell>
    );
}
