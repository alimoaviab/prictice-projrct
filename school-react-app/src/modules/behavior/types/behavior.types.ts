export interface BehaviorFormInput {
  student_id: string;
  class_id: string;
  category: string;
  incident_type: string;
  description: string;
  severity: "low" | "medium" | "critical" | "minor" | "moderate" | "major";
  action_taken: string;
  status: "open" | "reviewing" | "resolved" | "escalated" | "dismissed";
  warning_count: number;
  parent_notified: boolean;
  notes: string;
  attachments?: string[];
}

export interface BehaviorRecordRow extends BehaviorFormInput {
  _id: string;
  school_id: string;
  student_name: string;
  class_name: string;
  teacher_id: string;
  teacher_name: string;
  created_at: string;
  updated_at: string;
}
