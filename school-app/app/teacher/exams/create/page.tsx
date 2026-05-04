"use client";

import { SchoolShell } from "../../../../layouts/SchoolShell";
import { ExamCreatePage } from "../../../../modules/exams/pages/ExamCreatePage";

export default function TeacherExamCreatePage() {
  return (
    <SchoolShell eyebrow="Teacher Dashboard" title="Schedule Exam">
      <ExamCreatePage />
    </SchoolShell>
  );
}
