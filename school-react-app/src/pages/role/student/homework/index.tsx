import { Suspense } from "react";
import { HomeworkPage } from "@/modules/homework/pages/HomeworkPage";

export function StudentHomeworkPage() {
  return (
    <Suspense fallback={<div>Loading homework...</div>}>
      <HomeworkPage role="STUDENT" />
    </Suspense>
  );
}
