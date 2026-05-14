import { useSearchParams } from "react-router-dom";
import { Suspense } from "react";
export const dynamic = "force-dynamic";
import { SchoolShell } from "@/layouts/SchoolShell";
import { ResultListPage } from "@/modules/results/pages/ResultListPage";

function TeacherResultsContent() {
  const [searchParams] = useSearchParams();
  const exam_id = searchParams.get("exam_id");
  
  const filters = exam_id ? { exam_id } : undefined;

  return (
    <SchoolShell eyebrow="Teacher Dashboard" title="Results">
      <ResultListPage filters={filters} />
    </SchoolShell>
  );
}

export function TeacherResultsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TeacherResultsContent />
    </Suspense>
  );
}
