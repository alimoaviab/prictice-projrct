export interface ExamFormInput {
  academic_year_id: string;
  class_id: string;
  teacher_id?: string;
  subject: string;
  title: string;
  starts_at: string;
  max_marks: number;
  status: "scheduled" | "completed" | "cancelled" | "results_published";
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
  status: "scheduled" | "completed" | "cancelled" | "results_published";
  description: string;
  results_count?: number;
}

export interface ExamOption {
  id: string;
  label: string;
}