import { SchoolShell } from "@/layouts/SchoolShell";
import { AttendanceListPage } from "@/modules/attendance/pages/AttendanceListPage";

export function TeacherAttendancePage() {
  return (
    <SchoolShell eyebrow="Teacher Dashboard" title="Attendance Records">
      <AttendanceListPage />
    </SchoolShell>
  );
}
