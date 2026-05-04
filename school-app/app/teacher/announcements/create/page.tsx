import { SchoolShell } from "../../../../layouts/SchoolShell";
import { AnnouncementCreatePage } from "../../../../modules/announcements/pages/AnnouncementCreatePage";

export default function TeacherAnnouncementCreatePage() {
  return (
    <SchoolShell eyebrow="Teacher Dashboard" title="Create Announcement">
      <AnnouncementCreatePage />
    </SchoolShell>
  );
}
