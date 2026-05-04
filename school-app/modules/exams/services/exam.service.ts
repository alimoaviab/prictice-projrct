import { serviceRequest } from "../../../services/service-client";
import { getAcademyCareQuery } from "../../../services/academy-care-context";
import { ExamFormInput, ExamRow } from "../types/exam.types";

export function listExams(filters?: { class_id?: string; subject?: string }) {
  const baseQuery = getAcademyCareQuery();
  let filterQuery = "";
  if (filters?.class_id) filterQuery += `&class_id=${filters.class_id}`;
  if (filters?.subject) filterQuery += `&subject=${filters.subject}`;
  
  return serviceRequest<ExamRow[]>(`/api/exams${baseQuery}${filterQuery}`);
}

export function createExam(input: ExamFormInput) {
  return serviceRequest<ExamRow>("/api/exams", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateExam(id: string, input: Partial<ExamFormInput>) {
  return serviceRequest<ExamRow>(`/api/exams/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function deleteExam(id: string) {
  return serviceRequest<{ success: boolean; id: string }>(`/api/exams/${id}`, {
    method: "DELETE"
  });
}