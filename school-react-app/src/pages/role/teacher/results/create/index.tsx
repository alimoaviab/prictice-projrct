import { SchoolShell } from "@/layouts/SchoolShell";
import { ResultCreatePage } from "@/modules/results/pages/ResultCreatePage";

export function TeacherResultCreatePage() {
  return (
    <SchoolShell eyebrow="Teacher Dashboard" title="Record Result">
      <ResultCreatePage />
    </SchoolShell>
  );
}
