import { SchoolShell } from "@/layouts/SchoolShell";
import { QuestionPaperDashboard } from "./dashboard";

export function AdminQuestionPapersPage() {
  return (
    <SchoolShell eyebrow="Academic" title="Question Papers">
      <QuestionPaperDashboard />
    </SchoolShell>
  );
}
