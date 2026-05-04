import { SchoolShell } from "../../../layouts/SchoolShell";
import { BehaviorListPage } from "../../../modules/behavior/pages/BehaviorListPage";

export default function BehaviorPage() {
  return (
    <SchoolShell eyebrow="Students" title="Behavior">
      <BehaviorListPage />
    </SchoolShell>
  );
}
