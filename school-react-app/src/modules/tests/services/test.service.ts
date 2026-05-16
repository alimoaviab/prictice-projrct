import { serviceRequest } from "@/services/service-client";
import { getSelectedAcademicYearId } from "@/services/academic-year-context";
import { TestFormInput, TestRow } from "../types/test.types";

export function listTests(filters?: { class_id?: string; subject?: string }) {
  const params = new URLSearchParams();
  const academicYearId = getSelectedAcademicYearId();
  if (academicYearId) params.append("academic_year_id", academicYearId);
  params.append("type", "test"); // Always filter for tests
  
  if (filters?.class_id) params.append("class_id", filters.class_id);
  if (filters?.subject) params.append("subject", filters.subject);
  
  const query = params.toString();
  return serviceRequest<TestRow[]>(`/api/tests${query ? `?${query}` : ""}`);
}

export function createTest(input: TestFormInput) {
  return serviceRequest<TestRow>("/api/tests", {
    method: "POST",
    body: JSON.stringify({ ...input, type: "test" })
  });
}

export function updateTest(id: string, input: Partial<TestFormInput>) {
  return serviceRequest<TestRow>(`/api/tests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function deleteTest(id: string) {
  return serviceRequest<{ success: boolean; id: string }>(`/api/tests/${id}`, {
    method: "DELETE"
  });
}
