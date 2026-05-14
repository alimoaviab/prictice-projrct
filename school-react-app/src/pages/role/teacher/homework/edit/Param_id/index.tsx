import { useParams } from "react-router-dom";
import { SchoolShell } from "@/layouts/SchoolShell";
import { HomeworkEditPage } from "@/modules/homework/pages/HomeworkEditPage";

export function TeacherHomeworkEditPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <SchoolShell title="Edit Homework" eyebrow="Teacher Dashboard">
      <HomeworkEditPage role="TEACHER" id={id ?? ""} />
    </SchoolShell>
  );
}
