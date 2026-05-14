import { SchoolShell } from "@/layouts/SchoolShell";
import LeaveListPage from "@/modules/leave/components/LeaveListPage";

export function LeavePage() {
  return (
    <SchoolShell eyebrow="Students" title="Leave Requests">
      <LeaveListPage />
    </SchoolShell>
  );
}
