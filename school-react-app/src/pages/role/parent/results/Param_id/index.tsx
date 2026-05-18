import { SchoolShell } from "@/layouts/SchoolShell";
import { ResultDetailPage } from "@/modules/results/pages/ResultDetailPage";

export function ParentResultDetailPage() {
  return (
    <SchoolShell eyebrow="Parent Dashboard" title="Child's Results Details">
      <ResultDetailPage />
    </SchoolShell>
  );
}
