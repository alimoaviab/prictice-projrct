import { SchoolShell } from "@/layouts/SchoolShell";
import { BehaviorDetailPage } from "@/modules/behavior/pages/BehaviorDetailPage";

export function TeacherBehaviorDetailPage() {
  return (
    <SchoolShell>
      <BehaviorDetailPage role="teacher" />
    </SchoolShell>
  );
}
