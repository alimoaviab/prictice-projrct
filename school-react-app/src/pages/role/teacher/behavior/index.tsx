import { SchoolShell } from "@/layouts/SchoolShell";
import { BehaviorListPage } from "@/modules/behavior/pages/BehaviorListPage";

export function TeacherBehaviorPage() {
  return (
    <SchoolShell eyebrow="Teacher Dashboard" title="Behavior Records">
      <BehaviorListPage />
    </SchoolShell>
  );
}
