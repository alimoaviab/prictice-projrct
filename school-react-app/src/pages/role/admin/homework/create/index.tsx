import { SchoolShell } from "@/layouts/SchoolShell";
import { HomeworkCreatePage } from "@/modules/homework/pages/HomeworkCreatePage";

export function AdminHomeworkCreatePage() {
  return (
    <SchoolShell title="Assign Homework" eyebrow="Academic Management">
      <HomeworkCreatePage role="ADMIN" />
    </SchoolShell>
  );
}
