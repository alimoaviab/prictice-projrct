import { useParams } from "react-router-dom";
import { SchoolShell } from "@/layouts/SchoolShell";
import { TimetableEditPage } from "@/modules/timetable/pages/TimetableEditPage";

export function AdminTimetableEditPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <SchoolShell eyebrow="Academic" title="Edit Timetable Entry">
      <TimetableEditPage id={id ?? ""} />
    </SchoolShell>
  );
}
