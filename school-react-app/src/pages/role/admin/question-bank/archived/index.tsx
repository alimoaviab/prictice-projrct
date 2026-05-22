import { SchoolShell } from "@/layouts/SchoolShell";
import { QuestionBankPage } from "@/modules/question-bank/pages/QuestionBankPage";

export function AdminArchivedQuestionsPage() {
  return (
    <SchoolShell eyebrow="Question Bank" title="Archived Questions">
      <QuestionBankPage defaultTab="archived" />
    </SchoolShell>
  );
}
