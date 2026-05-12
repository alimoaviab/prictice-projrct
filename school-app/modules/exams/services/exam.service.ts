import { serviceRequest } from "../../../services/service-client";
import { getSelectedAcademicYearId } from "../../../services/academic-year-context";
import { ExamFormInput, ExamRow } from "../types/exam.types";

export function listExams(filters?: { class_id?: string; subject?: string }) {
  const params = new URLSearchParams();
  const academicYearId = getSelectedAcademicYearId();
  if (academicYearId) params.append("academic_year_id", academicYearId);
  
  if (filters?.class_id) params.append("class_id", filters.class_id);
  if (filters?.subject) params.append("subject", filters.subject);
  
  const query = params.toString();
  return serviceRequest<ExamRow[]>(`/api/exams${query ? `?${query}` : ""}`);
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