import { SchoolShell } from "../../../../layouts/SchoolShell";
import { ExamCreatePage } from "../../../../modules/exams/pages/ExamCreatePage";

export default function AdminExamCreatePage() {
  return (
    <SchoolShell eyebrow="Academic" title="Schedule Exam">
      <ExamCreatePage />
    </SchoolShell>
  );
}
