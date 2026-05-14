import { serviceRequest } from "@/services/service-client";
import { StudentFormInput, StudentRow, StudentPatchInput } from "../types/student.types";

export function listStudents(filters?: { class_id?: string; status?: string; academic_year_id?: string }) {
  let qs = "";
  const params: string[] = [];
  if (filters?.class_id) params.push(`class_id=${filters.class_id}`);
  if (filters?.status) params.push(`status=${filters.status}`);
  if (filters?.academic_year_id) params.push(`academic_year_id=${filters.academic_year_id}`);
  if (params.length) qs = `?${params.join("&")}`;
  return serviceRequest<StudentRow[]>(`/api/students${qs}`);
}

export function createStudent(input: StudentFormInput) {
  return serviceRequest<StudentRow>("/api/students", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateStudent(id: string, input: Partial<StudentPatchInput> | Partial<StudentFormInput>) {
  return serviceRequest<StudentRow>(`/api/students/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteStudent(id: string) {
  return serviceRequest<{ success: boolean; id: string }>(`/api/students/${id}`, {
    method: "DELETE",
  });
}
