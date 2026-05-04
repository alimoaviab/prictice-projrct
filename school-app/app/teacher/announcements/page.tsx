"use client";

import { SchoolShell } from "../../../layouts/SchoolShell";
import { AnnouncementListPage } from "../../../modules/announcements/pages/AnnouncementListPage";

export default function TeacherAnnouncementsPage() {
  return (
    <SchoolShell eyebrow="Teacher Dashboard" title="Announcements">
      <AnnouncementListPage />
    </SchoolShell>
  );
}
