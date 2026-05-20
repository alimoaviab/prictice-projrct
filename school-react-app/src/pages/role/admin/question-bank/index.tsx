import { SchoolShell } from "@/layouts/SchoolShell";
import { QuestionBankPage } from "@/modules/question-bank/pages/QuestionBankPage";

export function AdminQuestionBankPage() {
  return (
    <SchoolShell eyebrow="Academic" title="Question Bank">
      <QuestionBankPage />
    </SchoolShell>
  );
}
