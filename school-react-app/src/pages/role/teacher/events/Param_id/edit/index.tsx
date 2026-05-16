
import { SchoolShell } from "@/layouts/SchoolShell";
import { EventEditPage } from "@/modules/events/pages/EventEditPage";

export function TeacherEventEditPage() {
  return (
    <SchoolShell eyebrow="Faculty" title="Edit Event">
      <EventEditPage />
    </SchoolShell>
  );
}
