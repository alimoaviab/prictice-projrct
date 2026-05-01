import { SchoolShell } from "../../../../layouts/SchoolShell";
import { TeacherCreatePage } from "../../../../modules/teachers/pages/TeacherCreatePage";

export default function AdminTeacherCreatePage() {
  return (
    <SchoolShell eyebrow="Operations" title="Add Teacher">
      <TeacherCreatePage />
    </SchoolShell>
  );
}
