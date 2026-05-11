import { SchoolShell } from "@/layouts/SchoolShell";
import { HomeworkPage } from "@/modules/homework/pages/HomeworkPage";

export default function AdminHomeworkPage() {
  return (
    <SchoolShell title="Homework" eyebrow="Academic Management">
      <HomeworkPage role="ADMIN" />
    </SchoolShell>
  );
}
