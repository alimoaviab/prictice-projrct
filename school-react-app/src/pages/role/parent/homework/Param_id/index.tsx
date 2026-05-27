import { useParams } from "react-router-dom";
import { SchoolShell } from "@/layouts/SchoolShell";
import { StudentHomeworkDetailPage } from "@/modules/homework/pages/StudentHomeworkDetailPage";

export function ParentHomeworkViewPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <SchoolShell eyebrow="Parent Portal" title="Homework Detail">
      <StudentHomeworkDetailPage homeworkId={id ?? ""} />
    </SchoolShell>
  );
}
