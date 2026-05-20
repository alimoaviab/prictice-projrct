import { SchoolShell } from "@/layouts/SchoolShell";
import { QuestionPaperListPage } from "@/modules/question-papers/pages/QuestionPaperListPage";

export function AdminQuestionPapersPage() {
  return (
    <SchoolShell eyebrow="Academic" title="Question Papers">
      <QuestionPaperListPage />
    </SchoolShell>
  );
}
