import { SchoolShell } from "@/layouts/SchoolShell";
import { ExamCreatePage } from "@/modules/exams/pages/ExamCreatePage";

// No giant page title — ExamCreatePage owns its header.
export function AdminExamCreatePage() {
  return (
    <SchoolShell>
      <ExamCreatePage />
    </SchoolShell>
  );
}
