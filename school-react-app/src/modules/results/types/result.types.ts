/**
 * Result wire types — match the new one-result-per-student-per-exam
 * architecture. The result row owns a `subjects[]` breakdown plus the
 * aggregate `obtained_marks` and computed `percentage`.
 */

export interface ResultSubjectRecord {
  subject_id: string;
  subject_name: string;
  obtained_marks: number;
  max_marks: number;
}

export interface ResultFormInput {
  exam_id: string;
  student_id: string;
  obtained_marks: number;
  grade: string;
  remarks: string;
}

export interface ResultRow {
  _id: string;
  exam_id: string;
  exam_title: string;
  // Joined display string ("Math, English, Physics, Chemistry") for
  // legacy widgets. New code should iterate `subjects[]` instead.
  exam_subject: string;
  // Aggregate max-marks across the exam's subjects.
  max_marks: number;
  student_id: string;
  student_name: string;
  admission_no: string;
  class_id: string;
  class_name: string;
  // Aggregate obtained marks across the exam's subjects.
  obtained_marks: number;
  // Per-subject breakdown — empty for legacy single-subject results.
  subjects?: ResultSubjectRecord[];
  // Computed by the backend (obtained / max * 100).
  percentage?: number;
  grade: string;
  remarks: string;
  graded_at: string;
}

export interface ResultOption {
  id: string;
  label: string;
  class_id?: string;
}
