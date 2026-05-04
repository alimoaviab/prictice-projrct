"use client";

import { SchoolShell } from "../../../layouts/SchoolShell";
import { AttendanceListPage } from "../../../modules/attendance/pages/AttendanceListPage";
import { useAuth } from "../../../hooks/useAuth";

export default function ParentAttendancePage() {
  const { user } = useAuth();
  
  return (
    <SchoolShell eyebrow="Parent Dashboard" title="Child's Attendance">
      <AttendanceListPage filters={user?.studentId ? { student_id: user.studentId } : undefined} />
    </SchoolShell>
  );
}
