"use client";

import { SchoolShell } from "../../../layouts/SchoolShell";
import { ResultListPage } from "../../../modules/results/pages/ResultListPage";

export default function TeacherResultsPage() {
  return (
    <SchoolShell eyebrow="Teacher Dashboard" title="Results">
      <ResultListPage />
    </SchoolShell>
  );
}
