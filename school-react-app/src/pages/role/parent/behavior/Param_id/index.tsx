import { SchoolShell } from "@/layouts/SchoolShell";
import { BehaviorDetailPage } from "@/modules/behavior/pages/BehaviorDetailPage";

export function ParentBehaviorDetailPage() {
  return (
    <SchoolShell>
      <BehaviorDetailPage role="parent" />
    </SchoolShell>
  );
}
