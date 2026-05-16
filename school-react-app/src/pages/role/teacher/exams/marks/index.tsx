import { useSearchParams } from "react-router-dom";
import { Suspense } from "react";
export const dynamic = "force-dynamic";
import { SchoolShell } from "@/layouts/SchoolShell";
import { ExamMarksGroupEntryPage } from "@/modules/exams/pages/ExamMarksGroupEntryPage";

function ExamMarksContent() {
  const [searchParams] = useSearchParams();
  const examId = searchParams.get("exam_id") || "";

  return (
    <SchoolShell>
      <ExamMarksGroupEntryPage examId={examId} role="TEACHER" />
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
