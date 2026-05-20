/**
 * Question Bank types.
 */

export type QuestionType = "mcq" | "short" | "long";
export type Difficulty = "easy" | "medium" | "hard";
export type QuestionStatus = "active" | "archived";

export interface BankQuestion {
  _id: string;
  school_id: string;
  created_by: string;
  board: string;
  class_id: string;
  class_name: string;
  subject: string;
  chapter: string;
  type: QuestionType;
  difficulty: Difficulty;
  question_html: string;
  options?: QuestionOption[];
  status: QuestionStatus;
  is_starred?: boolean; // Per-teacher, resolved on frontend
  created_at: string;
}

export interface QuestionOption {
  id: string;
  option_text: string;
  is_correct: boolean;
}

export interface CreateQuestionInput {
  board: string;
  class_id: string;
  subject: string;
  chapter: string;
  type: QuestionType;
  difficulty: Difficulty;
  question_html: string;
  options?: { option_text: string; is_correct: boolean }[];
}

export interface QuestionFilters {
  board?: string;
  class_id?: string;
  subject?: string;
  chapter?: string;
  type?: QuestionType | "";
  difficulty?: Difficulty | "";
  status?: QuestionStatus;
  starred_only?: boolean;
  search?: string;
}
