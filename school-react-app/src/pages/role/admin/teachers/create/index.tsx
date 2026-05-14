import { SchoolShell } from "@/layouts/SchoolShell";
import { TeacherCreatePage } from "@/modules/teachers/pages/TeacherCreatePage";

export function AdminTeacherCreatePage() {
  return (
    <SchoolShell eyebrow="Operations" title="Add Teacher">
      <TeacherCreatePage />
    </SchoolShell>
  );
}
