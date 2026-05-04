import { SchoolShell } from "../../../../layouts/SchoolShell";
import { BehaviorCreatePage } from "../../../../modules/behavior/pages/BehaviorCreatePage";

export default function TeacherBehaviorCreatePage() {
  return (
    <SchoolShell eyebrow="Teacher Dashboard" title="New Behavior Record">
      <BehaviorCreatePage />
    </SchoolShell>
  );
}
