import { serviceRequest } from "../../../services/service-client";
import { getAcademicYearQuery } from "../../../services/academic-year-context";
import { BehaviorFormInput, BehaviorRecordRow } from "../types/behavior.types";

export function listBehavior(filters?: { student_id?: string; teacher_id?: string; status?: string }) {
	const baseQuery = getAcademicYearQuery();
	let filterQuery = "";
	if (filters?.student_id) filterQuery += `&student_id=${filters.student_id}`;
	if (filters?.teacher_id) filterQuery += `&teacher_id=${filters.teacher_id}`;
	if (filters?.status) filterQuery += `&status=${filters.status}`;

	return serviceRequest<BehaviorRecordRow[]>(`/api/behavior${baseQuery}${filterQuery}`);
}

export function createBehavior(input: BehaviorFormInput) {
	return serviceRequest<BehaviorRecordRow>("/api/behavior", {
		method: "POST",
		body: JSON.stringify(input),
	});
}

export function updateBehavior(id: string, input: Partial<BehaviorFormInput>) {
	return serviceRequest<BehaviorRecordRow>(`/api/behavior/${id}`, {
		method: "PATCH",
		body: JSON.stringify(input),
	});
}

export function deleteBehavior(id: string) {
	return serviceRequest<{ success: boolean; id: string }>(`/api/behavior/${id}`, {
		method: "DELETE",
	});
}

