import { SchoolShell } from "../../../layouts/SchoolShell";
import LeaveListPage from "../../../modules/leave/components/LeaveListPage";

export default function LeavePage() {
  return (
    <SchoolShell eyebrow="Students" title="Leave Requests">
      <LeaveListPage />
    </SchoolShell>
  );
}
