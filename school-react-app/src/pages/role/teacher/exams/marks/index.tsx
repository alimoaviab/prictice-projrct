import { useSearchParams } from "react-router-dom";
import { Suspense } from "react";
export const dynamic = "force-dynamic";
import { SchoolShell } from "@/layouts/SchoolShell";
import { ExamMarksEntryPage } from "@/modules/exams/pages/ExamMarksEntryPage";

function ExamMarksContent() {
  const [searchParams] = useSearchParams();
  const examId = searchParams.get("exam_id") || "";

  return (
    <SchoolShell eyebrow="Teacher Dashboard" title="Marks Entry Workspace">
      <ExamMarksEntryPage examId={examId} />
    </SchoolShell>
  );
}

export function TeacherExamMarksPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExamMarksContent />
    </Suspense>
  );
}
