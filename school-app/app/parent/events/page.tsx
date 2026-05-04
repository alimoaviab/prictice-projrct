"use client";

import { SchoolShell } from "../../../layouts/SchoolShell";
import EventListPage from "../../../modules/events/components/EventListPage";

export default function ParentEventsPage() {
  return (
    <SchoolShell eyebrow="Parent Dashboard" title="School Events">
      <EventListPage />
    </SchoolShell>
  );
}
