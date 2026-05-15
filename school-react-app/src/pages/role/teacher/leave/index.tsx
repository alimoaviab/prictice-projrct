import { SchoolShell } from "@/layouts/SchoolShell";
import { TeacherLeavePage } from "@/modules/leave/pages/TeacherLeavePage";

export default function TeacherLeaveRoute() {
  return (
    <SchoolShell>
      <TeacherLeavePage />
    </SchoolShell>
  );
}
