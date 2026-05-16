import { serviceRequest } from "@/services/service-client";
import { EventFormInput, EventRecordRow } from "../types/events.types";

export interface EventListFilters {
  eventType?: string;
  /** Strict filter — only events explicitly targeted at this class. */
  classId?: string;
  /** Loose filter — events targeted at this class OR school-wide.
   *  This is what the parent portal wants. */
  forClassId?: string;
}

export function listEvents(filters?: EventListFilters | string) {
  // Backwards compatible: callers passing a plain `eventType` string
  // continue to work. New callers pass an object.
  const params = new URLSearchParams();
  if (typeof filters === "string") {
    if (filters) params.set("event_type", filters);
  } else if (filters) {
    if (filters.eventType) params.set("event_type", filters.eventType);
    if (filters.classId) params.set("class_id", filters.classId);
    if (filters.forClassId) params.set("for_class_id", filters.forClassId);
  }
  const qs = params.toString();
  return serviceRequest<EventRecordRow[]>(`/api/events${qs ? `?${qs}` : ""}`);
}

export function getEvent(id: string) {
  return serviceRequest<EventRecordRow>(`/api/events/${id}`);
}

export function createEvent(input: EventFormInput) {
  return serviceRequest<EventRecordRow>("/api/events", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateEvent(id: string, input: Partial<EventFormInput>) {
  return serviceRequest<EventRecordRow>(`/api/events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteEvent(id: string) {
  return serviceRequest<{ success: boolean; id: string }>(`/api/events/${id}`, {
    method: "DELETE",
  });
}
