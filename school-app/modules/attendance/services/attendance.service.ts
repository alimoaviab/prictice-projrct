import { serviceRequest } from "../../../services/service-client";
import { AttendanceFormInput, AttendanceRecordRow } from "../types/attendance.types";

export function listAttendance() {
  return serviceRequest<AttendanceRecordRow[]>("/api/attendance");
}

export function createAttendance(input: AttendanceFormInput) {
  return serviceRequest<AttendanceRecordRow>("/api/attendance", {
    method: "POST",
    body: JSON.stringify(input)
  });
}
