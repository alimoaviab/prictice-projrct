import { serviceRequest } from "../../../services/service-client";
import { getAcademyCareQuery } from "../../../services/academy-care-context";
import { HomeworkFormInput, HomeworkRecordRow } from "../types/homework.types";

export function listHomework(filters?: { class_id?: string; teacher_id?: string }) {
  const baseQuery = getAcademyCareQuery();
  let filterQuery = "";
  if (filters?.class_id) filterQuery += `&class_id=${filters.class_id}`;
  if (filters?.teacher_id) filterQuery += `&teacher_id=${filters.teacher_id}`;
  
  return serviceRequest<HomeworkRecordRow[]>(`/api/homework${baseQuery}${filterQuery}`);
}

export function createHomework(input: HomeworkFormInput) {
  return serviceRequest<HomeworkRecordRow>("/api/homework", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateHomework(id: string, input: Partial<HomeworkFormInput>) {
  return serviceRequest<HomeworkRecordRow>(`/api/homework/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function deleteHomework(id: string) {
  return serviceRequest<{ success: boolean; id: string }>(`/api/homework/${id}`, {
    method: "DELETE"
  });
}
