import { SchoolShell } from "@/layouts/SchoolShell";
import { TeacherCreatePage } from "@/modules/teachers/pages/TeacherCreatePage";

// No giant page title — TeacherCreatePage owns its header.
export function AdminTeacherCreatePage() {
  return (
    <SchoolShell>
      <TeacherCreatePage />
    </SchoolShell>
  );
}
