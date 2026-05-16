import { useSearchParams } from "react-router-dom";
import { Suspense } from "react";
export const dynamic = "force-dynamic";
import { SchoolShell } from "@/layouts/SchoolShell";
import { ExamMarksGroupEntryPage } from "@/modules/exams/pages/ExamMarksGroupEntryPage";

function ExamMarksContent() {
  const [searchParams] = useSearchParams();
  const examId = searchParams.get("exam_id") || "";

  // Marks page owns its own compact header so we skip the SchoolShell
  // page title to keep top spacing tight.
  return (
    <SchoolShell>
      <ExamMarksGroupEntryPage examId={examId} role="ADMIN" />
    </SchoolShell>
  );
}

export function AdminExamMarksPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExamMarksContent />
    </Suspense>
  );
}
