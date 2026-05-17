import { useCallback, useEffect } from "react";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { showToast } from "@/utils/toast";
import { LeaveFormInput, LeaveRecordRow } from "../types/leave.types";
import { bindRefresh, publish } from "@/services/data-bus";
import * as service from "../services/leave.service";

export function useLeave() {
  const { state, run } = useSafeAsync<LeaveRecordRow[]>();

  const loadLeave = useCallback((requesterType?: string) => {
    return run(async () => {
      const result = await service.listLeave(requesterType);
      if (!result.ok) {
        throw new Error(result.error.message || "Failed to load leave requests");
      }
      return result.data;
    });
  }, [run]);

  const addLeave = useCallback(
    async (input: LeaveFormInput) => {
      const result = await service.createLeave(input);
      if (!result.ok) {
        showToast(result.error.message || "Could not submit leave request. Please check the dates and try again.", "error");
        return result;
      }
      showToast("Leave request created.", "success");
      await loadLeave();
      return result;
    },
    [loadLeave]
  );

  const updateLeave = useCallback(
    async (id: string, input: Partial<LeaveFormInput>) => {
      const result = await service.updateLeave(id, input);
      if (!result.ok) {
        showToast(result.error.message || "Could not update leave request. Please try again.", "error");
        return result;
      }
      showToast("Leave request updated.", "success");
      await loadLeave();
      return result;
    },
    [loadLeave]
  );

  const deleteLeave = useCallback(
    async (id: string) => {
      const result = await service.deleteLeave(id);
      if (!result.ok) {
        showToast(result.error.message || "Could not delete leave request. It may have already been processed.", "error");
        return result;
      }
      showToast("Leave request deleted.", "success");
      await loadLeave();
      return result;
    },
    [loadLeave]
  );

  const approveLeave = useCallback(
    async (id: string) => {
      const result = await service.approveLeave(id);
      if (!result.ok) {
        showToast(result.error.message || "Could not approve leave request. Please try again.", "error");
        return result;
      }
      showToast("Leave request approved.", "success");
      await loadLeave();
      return result;
    },
    [loadLeave]
  );

  const rejectLeave = useCallback(
    async (id: string, reason: string) => {
      const result = await service.rejectLeave(id, reason);
      if (!result.ok) {
        showToast(result.error.message || "Could not reject leave request. Please try again.", "error");
        return result;
      }
      showToast("Leave request rejected.", "success");
      await loadLeave();
      return result;
    },
    [loadLeave]
  );

  useEffect(() => {
    void loadLeave().catch(() => {});
    return bindRefresh("leave", loadLeave);
  }, [loadLeave]);

  return { state, addLeave, updateLeave, deleteLeave, approveLeave, rejectLeave };
}
