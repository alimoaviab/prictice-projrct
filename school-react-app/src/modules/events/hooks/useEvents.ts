import { useCallback, useEffect } from "react";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { showToast } from "@/utils/toast";
import { EventFormInput, EventRecordRow } from "../types/events.types";
import { bindRefresh, publish } from "@/services/data-bus";
import * as service from "../services/events.service";

export function useEvents() {
  const { state, run } = useSafeAsync<EventRecordRow[]>();

  const loadEvents = useCallback((eventType?: string) => {
    return run(async () => {
      const result = await service.listEvents(eventType);
      if (!result.success) {
        throw new Error(result.message || "Failed to load events");
      }
      return result.data;
    });
  }, [run]);

  const addEvent = useCallback(
    async (input: EventFormInput) => {
      const result = await service.createEvent(input);
      if (!result.success) {
        showToast(result.message || "Failed to create event", "error");
        return result;
      }
      showToast("Event created.", "success");
      await loadEvents();
      publish("events");
      return result;
    },
    [loadEvents]
  );

  const updateEvent = useCallback(
    async (id: string, input: Partial<EventFormInput>) => {
      const result = await service.updateEvent(id, input);
      if (!result.success) {
        showToast(result.message || "Failed to update", "error");
        return result;
      }
      showToast("Event updated.", "success");
      await loadEvents();
      publish("events");
      return result;
    },
    [loadEvents]
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      const result = await service.deleteEvent(id);
      if (!result.success) {
        showToast(result.message || "Failed to delete", "error");
        return result;
      }
      showToast("Event deleted.", "success");
      await loadEvents();
      publish("events");
      return result;
    },
    [loadEvents]
  );

  useEffect(() => {
    void loadEvents().catch(() => {});
    const offEvents = bindRefresh("events", loadEvents);
    const offClasses = bindRefresh("classes", loadEvents);
    return () => {
      offEvents();
      offClasses();
    };
  }, [loadEvents]);

  return { state, addEvent, updateEvent, deleteEvent };
}
