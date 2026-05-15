
import { SchoolShell } from "@/layouts/SchoolShell";
import { ResultDetailPage } from "@/modules/results/pages/ResultDetailPage";

export function AdminResultDetailPage() {
  return (
    <SchoolShell eyebrow="Academic" title="Result Details">
      <ResultDetailPage />
    </SchoolShell>
  );
}
