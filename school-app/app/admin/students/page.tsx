import { SchoolShell } from "../../../layouts/SchoolShell";
import { StudentsPage } from "../../../modules/students/pages/StudentsPage";

export default function AdminStudentsPage() {
  return (
    <SchoolShell eyebrow="Operations" title="Student Records">
      <StudentsPage />
    </SchoolShell>
  );
}
