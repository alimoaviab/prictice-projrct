import { useParams } from "react-router-dom";
import { SchoolShell } from "@/layouts/SchoolShell";
import { TimetableEditPage } from "@/modules/timetable/pages/TimetableEditPage";

// No giant page title — TimetableEditPage owns its header.
export function AdminTimetableEditPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <SchoolShell>
      <TimetableEditPage id={id ?? ""} />
    </SchoolShell>
  );
}
