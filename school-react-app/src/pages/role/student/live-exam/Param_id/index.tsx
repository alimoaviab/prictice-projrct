import { useParams } from "react-router-dom";
import { StudentExamPortal } from "@/components/live-exams/StudentExamPortal";
import { SchoolShell } from "@/layouts/SchoolShell";

export function StudentLiveExamSessionPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <SchoolShell title="Live Exam Session" eyebrow="Student">
      <div className="max-w-4xl mx-auto">
        <StudentExamPortal examId={id ?? ""} />
      </div>
    </SchoolShell>
  );
}
