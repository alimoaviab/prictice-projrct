import { serviceRequest } from "@/services/service-client";
import { getSelectedAcademicYearId } from "@/services/academic-year-context";
import {
  AttendanceBulkInput,
  AttendanceBulkResult,
  AttendanceFormInput,
  AttendanceRecordRow,
  ParentAttendanceReport,
  TeacherAttendanceSummary
} from "../types/attendance.types";

export function listAttendance(filters?: { class_id?: string; student_id?: string; date?: string; period?: number }) {
  const params = new URLSearchParams();
  const academicYearId = getSelectedAcademicYearId();
  if (academicYearId) params.append("academic_year_id", academicYearId);
  
  if (filters?.class_id) params.append("class_id", filters.class_id);
  if (filters?.student_id) params.append("student_id", filters.student_id);
  if (filters?.date) params.append("date", filters.date);
  if (filters?.period !== undefined) params.append("period", String(filters.period));

  const query = params.toString();
  return serviceRequest<AttendanceRecordRow[]>(`/api/attendance${query ? `?${query}` : ""}`);
}

export function createAttendance(input: AttendanceFormInput) {
  return serviceRequest<AttendanceRecordRow | AttendanceBulkResult>("/api/attendance", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function markAttendance(input: AttendanceBulkInput) {
  return serviceRequest<AttendanceBulkResult>("/api/attendance/mark", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateAttendance(id: string, input: Partial<AttendanceFormInput>) {
  return serviceRequest<AttendanceRecordRow>(`/api/attendance/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function deleteAttendance(id: string) {
  return serviceRequest<{ success: boolean; id: string }>(`/api/attendance/${id}`, {
    method: "DELETE"
  });
}

export function getTeacherAttendanceSummary(date?: string) {
  const query = date ? `?date=${date}` : "";
  return serviceRequest<TeacherAttendanceSummary>(`/api/attendance/summary${query}`);
}

export function getParentAttendance() {
  return serviceRequest<ParentAttendanceReport>("/api/parent/attendance");
}

export function getParentStudentAttendanceReport() {
  return serviceRequest<ParentAttendanceReport>("/api/parent/student-attendance");
}
