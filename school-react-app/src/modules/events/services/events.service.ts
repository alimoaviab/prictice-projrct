
import { serviceRequest } from "@/services/service-client";
import { EventFormInput, EventRecordRow } from "../types/events.types";

export function listEvents(eventType?: string) {
	let q = "";
	if (eventType) q = `?event_type=${eventType}`;
	return serviceRequest<EventRecordRow[]>(`/api/events${q}`);
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

