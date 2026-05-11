import { SchoolShell } from "@/layouts/SchoolShell";
import { HomeworkPage } from "@/modules/homework/pages/HomeworkPage";

export default function TeacherHomeworkPage() {
  return (
    <SchoolShell title="Homework" eyebrow="Teacher Dashboard">
      <HomeworkPage role="TEACHER" />
    </SchoolShell>
  );
}
