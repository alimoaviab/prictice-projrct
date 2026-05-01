import { SchoolShell } from "../../../../layouts/SchoolShell";
import { AttendanceCreatePage } from "../../../../modules/attendance/pages/AttendanceCreatePage";

export default function AdminAttendanceCreatePage() {
    return (
        <SchoolShell eyebrow="Academic" title="Mark Attendance">
            <AttendanceCreatePage />
        </SchoolShell>
    );
}
