import { serviceRequest } from "../../../services/service-client";
import { getAcademicYearQuery } from "../../../services/academic-year-context";
import { ResultFormInput, ResultRow } from "../types/result.types";

export function listResults(filters?: { exam_id?: string; student_id?: string }) {
  const baseQuery = getAcademicYearQuery();
  let filterQuery = "";
  if (filters?.exam_id) filterQuery += `&exam_id=${filters.exam_id}`;
  if (filters?.student_id) filterQuery += `&student_id=${filters.student_id}`;
  
  return serviceRequest<ResultRow[]>(`/api/results${baseQuery}${filterQuery}`);
}

export function saveResult(input: ResultFormInput) {
  return serviceRequest<ResultRow>("/api/results", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateResult(id: string, input: Partial<ResultFormInput>) {
  return serviceRequest<ResultRow>(`/api/results/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function deleteResult(id: string) {
  return serviceRequest<{ success: boolean; id: string }>(`/api/results/${id}`, {
    method: "DELETE"
  });
}