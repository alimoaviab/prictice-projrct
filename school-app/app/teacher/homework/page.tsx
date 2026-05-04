"use client";

import { SchoolShell } from "../../../layouts/SchoolShell";
import { HomeworkListPage } from "../../../modules/homework/pages/HomeworkListPage";

export default function TeacherHomeworkPage() {
  return (
    <SchoolShell eyebrow="Teacher Dashboard" title="Homework">
      <HomeworkListPage />
    </SchoolShell>
  );
}
