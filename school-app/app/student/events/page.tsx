"use client";

import { SchoolShell } from "../../../layouts/SchoolShell";
import EventListPage from "../../../modules/events/components/EventListPage";

export default function StudentEventsPage() {
    return (
        <SchoolShell eyebrow="Student Portal" title="Events">
            <EventListPage />
        </SchoolShell>
    );
}