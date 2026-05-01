import { SchoolShell } from "../../../layouts/SchoolShell";
import { StudentListPage } from "../../../modules/students/pages/StudentListPage";

export default function AdminStudentsPage() {
  return (
    <SchoolShell eyebrow="Operations" title="Student Records">
      <StudentListPage />
    </SchoolShell>
  );
}
