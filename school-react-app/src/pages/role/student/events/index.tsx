import { SchoolShell } from "@/layouts/SchoolShell";
import EventListPage from "@/modules/events/components/EventListPage";

export function StudentEventsPage() {
    return (
        <SchoolShell eyebrow="Parent Portal" title="Events">
            <EventListPage />
        </SchoolShell>
    );
}