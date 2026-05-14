import { SchoolShell } from "@/layouts/SchoolShell";
import { HomeworkCreatePage } from "@/modules/homework/pages/HomeworkCreatePage";

export function TeacherHomeworkCreatePage() {
  return (
    <SchoolShell title="Assign Homework" eyebrow="Teacher Dashboard">
      <HomeworkCreatePage role="TEACHER" />
    </SchoolShell>
  );
}
