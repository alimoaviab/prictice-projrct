import { SchoolShell } from "../../../../layouts/SchoolShell";
import { AnnouncementCreatePage } from "../../../../modules/announcements/pages/AnnouncementCreatePage";

export default function AdminAnnouncementCreatePage() {
    return (
        <SchoolShell eyebrow="Operations" title="New Announcement">
            <AnnouncementCreatePage />
        </SchoolShell>
    );
}
