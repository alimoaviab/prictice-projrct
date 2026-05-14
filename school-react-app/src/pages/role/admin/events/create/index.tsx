import { SchoolShell } from "@/layouts/SchoolShell";
import { EventCreatePage } from "@/modules/events/pages/EventCreatePage";

export function AdminEventCreatePage() {
    return (
        <SchoolShell eyebrow="Operations" title="New Event">
            <EventCreatePage />
        </SchoolShell>
    );
}
