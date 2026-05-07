import { StudentExamPortal } from "../../../../components/live-exams/StudentExamPortal";
import { SchoolShell } from "../../../../layouts/SchoolShell";

export default async function ExamSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return (
    <SchoolShell title="Live Exam Session" eyebrow="Student">
        <div className="max-w-4xl mx-auto">
            <StudentExamPortal examId={resolvedParams.id} />
        </div>
    </SchoolShell>
  );
}
