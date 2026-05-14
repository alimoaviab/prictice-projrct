export interface LeaveRecordRow {
  _id: string;
  requester_type: "student" | "teacher";
  requester_id: string;
  requester_name: string;
  class_name?: string;
  leave_type: "sick" | "personal" | "family" | "vacation" | "other";
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at?: string;
}

export interface LeaveFormInput {
  requester_type: LeaveRecordRow["requester_type"];
  requester_id: string;
  leave_type: LeaveRecordRow["leave_type"];
  start_date: string;
  end_date: string;
  reason: string;
}
