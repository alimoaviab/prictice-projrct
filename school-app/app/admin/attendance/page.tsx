import { SchoolShell } from "../../../layouts/SchoolShell";
import { AttendanceListPage } from "../../../modules/attendance/pages/AttendanceListPage";

export default function AdminAttendancePage() {
    return (
        <SchoolShell eyebrow="Academic" title="Attendance">
            <AttendanceListPage />
        </SchoolShell>
    );
}
