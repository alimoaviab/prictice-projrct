"use client";

import { SchoolShell } from "../../../../layouts/SchoolShell";
import { AttendanceCreatePage } from "../../../../modules/attendance/pages/AttendanceCreatePage";

export default function TeacherAttendanceCreatePage() {
  return (
    <SchoolShell eyebrow="Teacher Dashboard" title="Mark Attendance">
      <AttendanceCreatePage />
    </SchoolShell>
  );
}
