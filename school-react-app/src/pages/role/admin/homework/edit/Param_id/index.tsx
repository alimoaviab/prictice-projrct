import { useParams } from "react-router-dom";
import { SchoolShell } from "@/layouts/SchoolShell";
import { HomeworkEditPage } from "@/modules/homework/pages/HomeworkEditPage";

// No giant page title — HomeworkEditPage owns its header.
export function AdminHomeworkEditPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <SchoolShell>
      <HomeworkEditPage role="ADMIN" id={id ?? ""} />
    </SchoolShell>
  );
}
