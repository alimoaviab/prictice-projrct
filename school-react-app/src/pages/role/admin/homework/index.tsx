import { Suspense } from "react";
import { SchoolShell } from "@/layouts/SchoolShell";
import { HomeworkPage } from "@/modules/homework/pages/HomeworkPage";

export function AdminHomeworkPage() {
  return (
    <SchoolShell title="Homework" eyebrow="Academic Management">
      <Suspense fallback={<div>Loading homework...</div>}>
        <HomeworkPage role="ADMIN" />
      </Suspense>
    </SchoolShell>
  );
}
