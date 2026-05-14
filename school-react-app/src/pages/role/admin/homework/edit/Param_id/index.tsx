import { useParams } from "react-router-dom";
import { SchoolShell } from "@/layouts/SchoolShell";
import { HomeworkEditPage } from "@/modules/homework/pages/HomeworkEditPage";

export function AdminHomeworkEditPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <SchoolShell title="Edit Homework" eyebrow="Academic Management">
      <HomeworkEditPage role="ADMIN" id={id ?? ""} />
    </SchoolShell>
  );
}
