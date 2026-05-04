"use client";

import { useRouter, usePathname } from "next/navigation";
import { Card } from "../../../components/ui";
import { AnnouncementForm } from "../components/AnnouncementForm";
import { useAnnouncements } from "../hooks/useAnnouncements";
import { showToast } from "../../../utils/toast";

export function AnnouncementCreatePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { addAnnouncement } = useAnnouncements();

  async function handleCreate(input: any) {
    const result = await addAnnouncement(input);
    if (result.success) {
      showToast("Announcement published successfully", "success");
      const basePath = pathname.includes("/teacher") ? "/teacher/announcements" : "/admin/announcements";
      router.push(basePath);
    } else {
      showToast(result.message || "Failed to publish announcement", "error");
    }
    return result;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Create Announcement</h2>
        <AnnouncementForm onCreate={handleCreate} />
      </Card>
    </div>
  );
}
