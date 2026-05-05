import { serviceRequest } from "../../../services/service-client";
import { getAcademyCareQuery } from "../../../services/academy-care-context";
import {
  AttendanceBulkInput,
  AttendanceBulkResult,
  AttendanceFormInput,
  AttendanceRecordRow,
  ParentAttendanceReport,
  TeacherAttendanceSummary
} from "../types/attendance.types";

export function listAttendance(filters?: { class_id?: string; student_id?: string; date?: string }) {
  const baseQuery = getAcademyCareQuery();
  let filterQuery = "";
  if (filters?.class_id) filterQuery += `&class_id=${filters.class_id}`;
  if (filters?.student_id) filterQuery += `&student_id=${filters.student_id}`;
  if (filters?.date) filterQuery += `&date=${filters.date}`;

  return serviceRequest<AttendanceRecordRow[]>(`/api/attendance${baseQuery}${filterQuery}`);
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
