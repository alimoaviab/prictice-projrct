import { SchoolShell } from "@/layouts/SchoolShell";
import EventListPage from "@/modules/events/components/EventListPage";

export function ParentEventsPage() {
  return (
    <SchoolShell eyebrow="Parent Dashboard" title="School Events">
      <EventListPage />
    </SchoolShell>
  );
}
