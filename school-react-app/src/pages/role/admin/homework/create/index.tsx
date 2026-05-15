import { SchoolShell } from "@/layouts/SchoolShell";
import { HomeworkCreatePage } from "@/modules/homework/pages/HomeworkCreatePage";

// No giant page title — HomeworkCreatePage owns its header.
export function AdminHomeworkCreatePage() {
  return (
    <SchoolShell>
      <HomeworkCreatePage role="ADMIN" />
    </SchoolShell>
  );
}
