import { SchoolShell } from "@/layouts/SchoolShell";
import { QuestionPaperCreatePage } from "@/modules/question-papers/pages/QuestionPaperCreatePage";

export function AdminQuestionPaperCreatePage() {
  return (
    <SchoolShell eyebrow="Question Papers" title="Create Paper">
      <QuestionPaperCreatePage />
    </SchoolShell>
  );
}
