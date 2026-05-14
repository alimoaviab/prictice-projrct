
import { serviceRequest } from "@/services/service-client";
import { LeaveFormInput, LeaveRecordRow } from "../types/leave.types";

export function listLeave(requesterType?: string) {
	let q = "";
	if (requesterType) q = `?requester_type=${requesterType}`;
	return serviceRequest<LeaveRecordRow[]>(`/api/leave${q}`);
}

export function createLeave(input: LeaveFormInput) {
	return serviceRequest<LeaveRecordRow>("/api/leave", {
		method: "POST",
		body: JSON.stringify(input),
	});
}

export function updateLeave(id: string, input: Partial<LeaveFormInput>) {
	return serviceRequest<LeaveRecordRow>(`/api/leave/${id}`, {
		method: "PATCH",
		body: JSON.stringify(input),
	});
}

export function deleteLeave(id: string) {
	return serviceRequest<{ success: boolean; id: string }>(`/api/leave/${id}`, {
		method: "DELETE",
	});
}

export function approveLeave(id: string) {
	return serviceRequest<LeaveRecordRow>(`/api/leave/${id}`, {
		method: "PATCH",
		body: JSON.stringify({ status: "approved" }),
	});
}

export function rejectLeave(id: string, reason: string) {
	return serviceRequest<LeaveRecordRow>(`/api/leave/${id}`, {
		method: "PATCH",
		body: JSON.stringify({ status: "rejected", rejection_reason: reason }),
	});
}

