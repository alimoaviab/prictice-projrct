import { useCallback, useEffect } from "react";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { showToast } from "@/utils/toast";
import { AnnouncementFormInput, AnnouncementRecordRow } from "../types/announcement.types";
import * as service from "../services/announcement.service";

export function useAnnouncements() {
  const { state, run } = useSafeAsync<AnnouncementRecordRow[]>();

  const loadAnnouncements = useCallback(() => {
    return run(async () => {
      const result = await service.listAnnouncements();
      if (!result.success) {
        throw new Error(result.message || "Failed to load announcements");
      }
      return result.data;
    });
  }, [run]);

  const addAnnouncement = useCallback(
    async (input: AnnouncementFormInput) => {
      const result = await service.createAnnouncement(input);
      if (!result.success) {
        showToast(result.message || "Could not create announcement. Please check the details and try again.", "error");
        return result;
      }

      showToast("Announcement created.", "success");
      await loadAnnouncements();
      return result;
    },
    [loadAnnouncements]
  );

  const updateAnnouncement = useCallback(
    async (id: string, input: Partial<AnnouncementFormInput>) => {
      const result = await service.updateAnnouncement(id, input);
      if (!result.success) {
        showToast(result.message || "Could not update announcement. Please check your changes and try again.", "error");
        return result;
      }

      showToast("Announcement updated.", "success");
      await loadAnnouncements();
      return result;
    },
    [loadAnnouncements]
  );

  const deleteAnnouncement = useCallback(
    async (id: string) => {
      const result = await service.deleteAnnouncement(id);
      if (!result.success) {
        showToast(result.message || "Could not delete announcement. Please try again.", "error");
        return result;
      }

      showToast("Announcement deleted.", "success");
      await loadAnnouncements();
      return result;
    },
    [loadAnnouncements]
  );

  useEffect(() => {
    void loadAnnouncements().catch(() => {
      // Error state is already managed by useSafeAsync.
    });
  }, [loadAnnouncements]);

  return { state, addAnnouncement, updateAnnouncement, deleteAnnouncement };
}
