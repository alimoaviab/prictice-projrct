export interface TestFormInput {
  academic_year_id: string;
  class_id: string;
  teacher_id?: string;
  subject?: string;
  subjects?: string[]; // Multiple subjects support
  title: string;
  type?: "exam" | "test";
  starts_at: string;
  max_marks: number;
  status: "scheduled" | "completed" | "cancelled" | "results_published";
  description: string;
}

export interface TestRow {
  _id: string;
  class_id: string;
  class_name: string;
  subject: string;
  title: string;
  type: "exam" | "test";
  starts_at: string;
  max_marks: number;
  status: "scheduled" | "completed" | "cancelled" | "results_published";
  description: string;
  results_count?: number;
}

export interface TestOption {
  id: string;
  label: string;
}
