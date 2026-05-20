import { SchoolShell } from "@/layouts/SchoolShell";
import { QuestionBankPage } from "@/modules/question-bank/pages/QuestionBankPage";

export function AdminStarredQuestionsPage() {
  return (
    <SchoolShell eyebrow="Question Bank" title="Starred Questions">
      <QuestionBankPage defaultTab="starred" />
    </SchoolShell>
  );
}
