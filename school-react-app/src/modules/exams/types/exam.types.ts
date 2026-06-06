/**
 * Exam wire types.
 *
 * The architecture is one-exam → many-subjects:
 *   - `subjects[]` is the canonical, normalised list of {subject_id,
 *     subject_name, max_marks}.
 *   - `subject` (singular) and the top-level `max_marks` are kept for
 *     backward compatibility with old single-subject rows; new code
 *     should always read `subjects[]` and `subject_count`.
 */

export interface ExamSubjectInput {
  subject_id: string;
  subject_name?: string;
  max_marks: number;
}

export interface ExamFormInput {
  academic_year_id?: string;
  class_id: string;
  teacher_id?: string;
  title: string;
  type?: "exam" | "test";
  term?: string;
  starts_at: string;
  status: "scheduled" | "completed" | "cancelled" | "results_published";
  description?: string;
  subjects: ExamSubjectInput[];
}

export interface ExamSubjectRecord {
  subject_id: string;
  subject_name: string;
  max_marks: number;
}

export interface ExamRow {
  _id: string;
  class_id: string;
  class_name: string;
  // Joined display string for legacy widgets (e.g. "Math, English, …").
  subject: string;
  subjects: ExamSubjectRecord[];
  subject_count: number;
  title: string;
  type: "exam" | "test";
  term: string;
  starts_at: string;
  // Aggregate max-marks across all subjects.
  max_marks: number;
  status: "scheduled" | "completed" | "cancelled" | "results_published";
  description: string;
  results_count?: number;
}

export interface ExamOption {
  id: string;
  label: string;
}
