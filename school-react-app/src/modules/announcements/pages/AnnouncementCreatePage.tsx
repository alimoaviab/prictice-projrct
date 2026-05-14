import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui";
import { AnnouncementForm } from "../components/AnnouncementForm";
import { useAnnouncements } from "../hooks/useAnnouncements";
import { showToast } from "@/utils/toast";

export function AnnouncementCreatePage() {
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const { addAnnouncement } = useAnnouncements();

  async function handleCreate(input: any) {
    const result = await addAnnouncement(input);
    if (result.success) {
      showToast("Announcement published successfully", "success");
      const basePath = pathname.includes("/teacher") ? "/teacher/announcements" : "/admin/announcements";
      navigate(basePath);
    } else {
      showToast(result.message || "Failed to publish announcement", "error");
    }
    return result;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card className="p-3">
        <h2 className="mb-4 text-base font-semibold tracking-tight text-slate-950">Create Announcement</h2>
        <AnnouncementForm onCreate={handleCreate} />
      </Card>
    </div>
  );
}
