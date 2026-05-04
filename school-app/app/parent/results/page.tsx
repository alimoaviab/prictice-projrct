"use client";

import { SchoolShell } from "../../../layouts/SchoolShell";
import { ResultListPage } from "../../../modules/results/pages/ResultListPage";
import { useAuth } from "../../../hooks/useAuth";

export default function ParentResultsPage() {
  const { user } = useAuth();
  
  return (
    <SchoolShell eyebrow="Parent Dashboard" title="Child's Results">
      <ResultListPage filters={user?.studentId ? { student_id: user.studentId } : undefined} />
    </SchoolShell>
  );
}
