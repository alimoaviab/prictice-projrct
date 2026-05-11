import { SchoolShell } from "@/layouts/SchoolShell";
import { HomeworkEditPage } from "@/modules/homework/pages/HomeworkEditPage";

export default function TeacherHomeworkEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <SchoolShell title="Edit Homework" eyebrow="Teacher Dashboard">
      <HomeworkEditPage role="TEACHER" id={(params as any).id} />
    </SchoolShell>
  );
}
