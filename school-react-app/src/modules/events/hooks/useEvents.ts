import { useCallback, useEffect } from "react";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { showToast } from "@/utils/toast";
import { EventFormInput, EventRecordRow } from "../types/events.types";
import { bindRefresh, publish } from "@/services/data-bus";
import * as service from "../services/events.service";

export function useEvents(filters?: import("../services/events.service").EventListFilters) {
  const { state, run } = useSafeAsync<EventRecordRow[]>();
  const filterKey = JSON.stringify(filters ?? {});

  const loadEvents = useCallback(
    (override?: string | import("../services/events.service").EventListFilters) => {
      return run(async () => {
        // Back-compat: a string override is treated as event_type.
        const effective = override ?? filters;
        const result = await service.listEvents(effective as any);
        if (!result.success) {
          throw new Error(result.message || "Failed to load events");
        }
        return result.data;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [run, filterKey]
  );

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

export function useEvent(id: string | undefined) {
  const { state, run } = useSafeAsync<EventRecordRow>();

  const loadEvent = useCallback(() => {
    if (!id) return;
    return run(async () => {
      const result = await service.getEvent(id);
      if (!result.success) {
        throw new Error(result.message || "Failed to load event");
      }
      return result.data;
    });
  }, [id, run]);

  useEffect(() => {
    void loadEvent();
  }, [loadEvent]);

  return { state, refresh: loadEvent };
}
