"use client";

import { SchoolShell } from "../../../layouts/SchoolShell";
import EventListPage from "../../../modules/events/components/EventListPage";

export default function TeacherEventsPage() {
  return (
    <SchoolShell eyebrow="Teacher Dashboard" title="Events">
      <EventListPage />
    </SchoolShell>
  );
}
