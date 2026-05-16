
import { SchoolShell } from "@/layouts/SchoolShell";
import { EventEditPage } from "@/modules/events/pages/EventEditPage";

export function AdminEventEditPage() {
  return (
    <SchoolShell eyebrow="Operations" title="Edit Event">
      <EventEditPage />
    </SchoolShell>
  );
}
