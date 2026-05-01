export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface AttendanceRecordRow {
  _id: string;
  student_id: string;
  class_id: string;
  student_name: string;
  admission_no: string;
  class_name: string;
  date: string;
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceFormInput {
  student_id: string;
  class_id: string;
  date: string;
  status: AttendanceStatus;
  note?: string;
}
