/**
 * Question Papers module types.
 */

export type QuestionType = string;
export type Difficulty = "easy" | "medium" | "hard";

export interface QuestionPaper {
  _id: string;
  school_id: string;
  title: string;
  class_id: string;
  class_name: string;
  subject_id?: string;
  subject_name?: string;
  chapter_ids?: string[];
  teacher_id?: string;
  teacher_name?: string;
  date?: string;
  status: "draft" | "published";
  questions: PaperQuestion[];
  created_at: string;
  updated_at: string;
}

export interface PaperQuestion {
  id: string;
  type: QuestionType;
  question: string;
  marks: number;
  difficulty: Difficulty;
  options?: string[]; // MCQ options
  correct_answer?: string;
  sort_order: number;
}

export interface QuestionPaperFormInput {
  title: string;
  class_id: string;
  subject_id?: string;
  chapter_ids?: string[];
  teacher_id?: string;
  date?: string;
  questions?: PaperQuestion[];
}

export interface QuestionFormInput {
  type: QuestionType;
  question: string;
  marks: number;
  difficulty: Difficulty;
  options?: string[];
  correct_answer?: string;
}
