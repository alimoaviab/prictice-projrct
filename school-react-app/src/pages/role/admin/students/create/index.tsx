import { SchoolShell } from "@/layouts/SchoolShell";
import { StudentCreatePage } from "@/modules/students/pages/StudentCreatePage";

export function AdminStudentCreatePage() {
  return (
    <SchoolShell eyebrow="Operations" title="New Student">
      <StudentCreatePage />
    </SchoolShell>
  );
}
