import { TimetablePage } from "@/modules/timetable/pages/TimetablePage";
import { SchoolShell } from "@/layouts/SchoolShell";

export function TimetableRoute() {
  return (
    <SchoolShell eyebrow="Academic" title="Timetable">
      <TimetablePage />
    </SchoolShell>
  );
}
