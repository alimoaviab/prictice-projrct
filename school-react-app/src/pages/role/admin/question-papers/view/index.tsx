import { SchoolShell } from "@/layouts/SchoolShell";
import { QuestionPaperViewPage } from "@/modules/question-papers/pages/QuestionPaperViewPage";

export function AdminQuestionPaperViewPage() {
  return (
    <SchoolShell eyebrow="Question Papers" title="View Paper">
      <QuestionPaperViewPage />
    </SchoolShell>
  );
}
