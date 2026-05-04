"use client";

import { SchoolShell } from "../../../../layouts/SchoolShell";
import { HomeworkCreatePage } from "../../../../modules/homework/pages/HomeworkCreatePage";

export default function TeacherHomeworkCreatePage() {
  return (
    <SchoolShell eyebrow="Teacher Dashboard" title="Assign Homework">
      <HomeworkCreatePage />
    </SchoolShell>
  );
}
