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
  exam_subject: string;
  max_marks: number;
  student_id: string;
  student_name: string;
  admission_no: string;
  class_id: string;
  class_name: string;
  obtained_marks: number;
  grade: string;
  remarks: string;
  graded_at: string;
}

export interface ResultOption {
  id: string;
  label: string;
  class_id?: string;
}