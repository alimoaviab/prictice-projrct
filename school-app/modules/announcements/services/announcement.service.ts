import { serviceRequest } from "../../../services/service-client";
import { AnnouncementFormInput, AnnouncementRecordRow } from "../types/announcement.types";

export function listAnnouncements() {
	return serviceRequest<AnnouncementRecordRow[]>("/api/announcements");
}

export function createAnnouncement(input: AnnouncementFormInput) {
	return serviceRequest<AnnouncementRecordRow>("/api/announcements", {
		method: "POST",
		body: JSON.stringify(input)
	});
}

export function updateAnnouncement(id: string, input: Partial<AnnouncementFormInput>) {
	return serviceRequest<AnnouncementRecordRow>(`/api/announcements/${id}`, {
		method: "PATCH",
		body: JSON.stringify(input)
	});
}

export function deleteAnnouncement(id: string) {
	return serviceRequest<{ success: boolean; id: string }>(`/api/announcements/${id}`, {
		method: "DELETE"
	});
}
