
import { SchoolShell } from "@/layouts/SchoolShell";
import { ResultDetailPage } from "@/modules/results/pages/ResultDetailPage";

export function TeacherResultDetailPage() {
  return (
    <SchoolShell eyebrow="Teacher Dashboard" title="Result Details">
      <ResultDetailPage />
    </SchoolShell>
  );
}
