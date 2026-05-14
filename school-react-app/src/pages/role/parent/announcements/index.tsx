import { SchoolShell } from "@/layouts/SchoolShell";
import { AnnouncementListPage } from "@/modules/announcements/pages/AnnouncementListPage";

export function ParentAnnouncementsPage() {
  return (
    <SchoolShell eyebrow="Parent Dashboard" title="School Announcements">
      <AnnouncementListPage />
    </SchoolShell>
  );
}
