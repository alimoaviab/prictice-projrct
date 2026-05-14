import { SchoolShell } from "@/layouts/SchoolShell";
import { StudentListPage } from "@/modules/students/pages/StudentListPage";

export function AdminStudentsPage() {
  return (
    <SchoolShell eyebrow="Operations" title="Student Records">
      <StudentListPage />
    </SchoolShell>
  );
}
