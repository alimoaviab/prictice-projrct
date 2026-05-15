import { SchoolShell } from "@/layouts/SchoolShell";
import { BehaviorDetailPage } from "@/modules/behavior/pages/BehaviorDetailPage";

export function AdminBehaviorDetailPage() {
  return (
    <SchoolShell>
      <BehaviorDetailPage role="admin" />
    </SchoolShell>
  );
}
