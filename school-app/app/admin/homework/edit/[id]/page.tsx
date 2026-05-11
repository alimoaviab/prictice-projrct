import { SchoolShell } from "@/layouts/SchoolShell";
import { HomeworkEditPage } from "@/modules/homework/pages/HomeworkEditPage";

export default function AdminHomeworkEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <SchoolShell title="Edit Homework" eyebrow="Academic Management">
      <HomeworkEditPage role="ADMIN" id={(params as any).id} />
    </SchoolShell>
  );
}
