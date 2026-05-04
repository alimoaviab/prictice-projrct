"use client";

import { SchoolShell } from "../../../layouts/SchoolShell";
import { ExamListPage } from "../../../modules/exams/pages/ExamListPage";

export default function TeacherExamsPage() {
  return (
    <SchoolShell eyebrow="Teacher Dashboard" title="Exams">
      <ExamListPage />
    </SchoolShell>
  );
}
