export interface BehaviorRecordRow {
  _id: string;
  id?: string;
  student_id: string;
  student_name: string;
  class_id: string;
  class_name: string;
  incident_type: "attendance" | "conduct" | "academic_dishonesty" | "bullying" | "vandalism" | "other";
  severity: "minor" | "moderate" | "major" | "critical";
  description: string;
  action_taken?: string;
  status: "open" | "under_review" | "resolved" | "escalated";
  warning_count: number;
  parent_notified: boolean;
  notes?: string;
  created_at?: string;
}

export interface BehaviorFormInput {
  student_id: string;
  class_id: string;
  incident_type: BehaviorRecordRow["incident_type"];
  severity: BehaviorRecordRow["severity"];
  description: string;
  action_taken?: string;
  status?: BehaviorRecordRow["status"];
  warning_count?: number;
  parent_notified?: boolean;
  notes?: string;
}
