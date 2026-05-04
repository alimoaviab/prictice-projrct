import { SchoolShell } from "../../../layouts/SchoolShell";
import EventListPage from "../../../modules/events/components/EventListPage";

export default function EventsPage() {
  return (
    <SchoolShell eyebrow="Operations" title="Events">
      <EventListPage />
    </SchoolShell>
  );
}
