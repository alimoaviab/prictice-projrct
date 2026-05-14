import { SchoolShell } from "@/layouts/SchoolShell";
import EventListPage from "@/modules/events/components/EventListPage";

export function TeacherEventsPage() {
  return (
    <SchoolShell eyebrow="Teacher Dashboard" title="Events">
      <EventListPage />
    </SchoolShell>
  );
}
