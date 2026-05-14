import { SchoolShell } from "@/layouts/SchoolShell";
import { AnnouncementListPage } from "@/modules/announcements/pages/AnnouncementListPage";

export function TeacherAnnouncementsPage() {
  return (
    <SchoolShell eyebrow="Teacher Dashboard" title="Announcements">
      <AnnouncementListPage />
    </SchoolShell>
  );
}
