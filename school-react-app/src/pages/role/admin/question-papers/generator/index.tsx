import { SchoolShell } from "@/layouts/SchoolShell";
import { QuestionPaperGeneratorPage } from "@/modules/question-papers/pages/QuestionPaperGeneratorPage";

export function AdminQuestionPaperGeneratorPage() {
  return (
    <SchoolShell eyebrow="Question Papers" title="Paper Generator">
      <QuestionPaperGeneratorPage />
    </SchoolShell>
  );
}
