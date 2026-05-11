"use client";

import { useSearchParams } from "next/navigation";
import { SchoolShell } from "../../../layouts/SchoolShell";
import { ResultListPage } from "../../../modules/results/pages/ResultListPage";

export default function TeacherResultsPage() {
  const searchParams = useSearchParams();
  const exam_id = searchParams.get("exam_id");
  
  const filters = exam_id ? { exam_id } : undefined;

  return (
    <SchoolShell eyebrow="Teacher Dashboard" title="Results">
      <ResultListPage filters={filters} />
    </SchoolShell>
  );
}
