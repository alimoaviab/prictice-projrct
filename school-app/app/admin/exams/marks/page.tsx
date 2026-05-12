"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
export const dynamic = "force-dynamic";
import { SchoolShell } from "../../../../layouts/SchoolShell";
import { ExamMarksEntryPage } from "../../../../modules/exams/pages/ExamMarksEntryPage";

function ExamMarksContent() {
  const searchParams = useSearchParams();
  const examId = searchParams.get("exam_id") || "";

  return (
    <SchoolShell eyebrow="Admin Dashboard" title="Marks Entry Workspace">
      <ExamMarksEntryPage examId={examId} role="ADMIN" />
    </SchoolShell>
  );
}

export default function AdminExamMarksPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExamMarksContent />
    </Suspense>
  );
}
