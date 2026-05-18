import { SchoolShell } from "@/layouts/SchoolShell";
import LeaveListPage from "@/modules/leave/components/LeaveListPage";

export default function TeacherLeaveRoute() {
  return (
    <SchoolShell>
      <LeaveListPage />
    </SchoolShell>
  );
}
