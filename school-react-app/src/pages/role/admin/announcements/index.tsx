import { SchoolShell } from "@/layouts/SchoolShell";
import { AnnouncementPage } from "@/modules/announcements/pages/AnnouncementPage";

export function AdminAnnouncementsPage() {
    return (
        <SchoolShell eyebrow="Operations" title="Announcements">
            <AnnouncementPage />
        </SchoolShell>
    );
}
