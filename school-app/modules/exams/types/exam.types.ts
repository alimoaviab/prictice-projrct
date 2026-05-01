export interface ExamFormInput {
  class_id: string;
  subject: string;
  title: string;
  starts_at: string;
  max_marks: number;
  status: "scheduled" | "completed" | "cancelled";
  description: string;
}

export interface ExamRow {
  _id: string;
  class_id: string;
  class_name: string;
  subject: string;
  title: string;
  starts_at: string;
  max_marks: number;
  status: "scheduled" | "completed" | "cancelled";
  description: string;
}

export interface ExamOption {
  id: string;
  label: string;
}