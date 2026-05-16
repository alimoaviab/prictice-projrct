import { serviceRequest } from "@/services/service-client";
import { getSelectedAcademicYearId } from "@/services/academic-year-context";
import { ResultFormInput, ResultRow } from "../types/result.types";

export function listResults(filters?: { exam_id?: string; student_id?: string }) {
  const params = new URLSearchParams();
  const academicYearId = getSelectedAcademicYearId();
  if (academicYearId) params.append("academic_year_id", academicYearId);
  
  if (filters?.exam_id) params.append("exam_id", filters.exam_id);
  if (filters?.student_id) params.append("student_id", filters.student_id);
  
  const query = params.toString();
  
  // Detect if we should use parent portal API
  const isParentPortal = typeof window !== 'undefined' && window.location.pathname.includes('/parent');
  const endpoint = isParentPortal ? `/api/parent/student-results` : `/api/results`;
  
  return serviceRequest<any>(`${endpoint}${query ? `?${query}` : ""}`);
}

export function getResult(id: string) {
  return serviceRequest<ResultRow>(`/api/results/${id}`);
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