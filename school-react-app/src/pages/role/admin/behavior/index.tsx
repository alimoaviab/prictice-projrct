import { SchoolShell } from "@/layouts/SchoolShell";
import { BehaviorListPage } from "@/modules/behavior/pages/BehaviorListPage";

export function BehaviorPage() {
  return (
    <SchoolShell eyebrow="Academic" title="Behavior">
      <BehaviorListPage />
    </SchoolShell>
  );
}
