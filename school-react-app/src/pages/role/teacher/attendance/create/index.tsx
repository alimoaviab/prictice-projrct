import { SchoolShell } from "@/layouts/SchoolShell";
import { AttendanceCreatePage } from "@/modules/attendance/pages/AttendanceCreatePage";

export function TeacherAttendanceCreatePage() {
  return (
    <SchoolShell eyebrow="Teacher Dashboard" title="Mark Attendance">
      <AttendanceCreatePage />
    </SchoolShell>
  );
}
