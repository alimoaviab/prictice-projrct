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
  teacher_id?: string;
}

export interface AttendanceFormInput {
  student_id: string;
  class_id: string;
  date: string;
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceBulkInput {
  class_id: string;
  date: string;
  academic_year_id?: string;
  records: Record<string, AttendanceStatus>;
}

export interface AttendanceBulkResult {
  message: string;
  saved: number;
  failed: number;
  total: number;
  failed_records?: Array<{ student_id: string; reason: string }>;
}

export interface AttendanceClassSummary {
  id: string;
  name: string;
  total_students: number;
  marked_today: number;
  percentage: number;
  status: "complete" | "incomplete";
}

export interface TeacherAttendanceSummary {
  date: string;
  classes: AttendanceClassSummary[];
}

export interface ParentAttendanceStudent {
  student_id: string;
  student_name: string;
  class_name: string;
  total_present: number;
  total_absent: number;
  total_excused: number;
  percentage: number;
  recent_records: Array<{ date: string; status: AttendanceStatus }>;
}

export interface ParentAttendanceReport {
  students: ParentAttendanceStudent[];
}
