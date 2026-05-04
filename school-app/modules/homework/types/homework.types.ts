export type HomeworkStatus = "draft" | "assigned" | "closed";

export interface HomeworkRecordRow {
  _id: string;
  class_id: string;
  class_name: string;
  teacher_id: string;
  teacher_name: string;
  teacher_employee_no: string;
  subject_id: string;
  subject_name: string;
  title: string;
  instructions?: string;
  due_at: string;
  status: HomeworkStatus;
}

export interface HomeworkFormInput {
  class_id: string;
  teacher_id: string;
  subject_id: string;
  title: string;
  instructions?: string;
  due_at: string;
  status: HomeworkStatus;
}
