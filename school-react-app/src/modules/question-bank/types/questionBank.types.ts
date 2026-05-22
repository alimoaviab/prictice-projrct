/**
 * Question Bank types — Enterprise Question Bank Module.
 *
 * Aligned with backend `/api/questions` and `/api/question-bank` shape:
 *   - The Question doc uses subject_id / chapter_id (not free-text fields).
 *   - Frontend keeps optional subject_name / chapter_name / class_name for display.
 */

export type QuestionType = "mcq" | "short" | "long";
export type Difficulty = "easy" | "medium" | "hard";
export type QuestionStatus = "active" | "archived";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface BankQuestion {
  _id: string;
  school_id: string;
  created_by: string;
  created_by_name?: string;
  /** Optional legacy field. New questions use `subject_id`. */
  board?: string;
  class_id: string;
  class_name?: string;
  subject_id?: string;
  subject_name?: string;
  /** Free-text field used by older imports; prefer `subject_name`. */
  subject?: string;
  chapter_id?: string;
  chapter_name?: string;
  /** Free-text field used by older imports; prefer `chapter_name`. */
  chapter?: string;
  type: QuestionType;
  difficulty: Difficulty;
  question_html: string;
  /**
   * Backend returns options as JSON-stringified array. Frontend either
   * keeps it as string or parses lazily. We accept both shapes.
   */
  options?: string | QuestionOption[];
  marks?: number;
  status: QuestionStatus;
  approval_status?: ApprovalStatus;
  is_starred?: boolean; // resolved on frontend
  created_at: string;
  updated_at?: string;
}

export interface QuestionOption {
  id?: string;
  option_text: string;
  is_correct: boolean;
}

export interface CreateQuestionInput {
  /** Optional legacy/board metadata. */
  board?: string;
  class_id: string;
  subject_id?: string;
  /** Free-text subject for legacy callers — backend accepts both. */
  subject?: string;
  chapter_id?: string;
  /** Free-text chapter for legacy callers — backend accepts both. */
  chapter?: string;
  type: QuestionType;
  difficulty: Difficulty;
  marks?: number;
  question_html: string;
  /** When type=mcq, options is a JSON-encoded array of {option_text,is_correct}. */
  options?: { option_text: string; is_correct: boolean }[];
}

export interface QuestionFilters {
  board?: string;
  class_id?: string;
  subject?: string;
  subject_id?: string;
  chapter?: string;
  chapter_id?: string;
  type?: QuestionType | "";
  difficulty?: Difficulty | "";
  status?: QuestionStatus;
  starred_only?: boolean;
  search?: string;
}

export interface QuestionStats {
  total: number;
  mcq: number;
  short: number;
  long: number;
  easy: number;
  medium: number;
  hard: number;
}

export interface AutoGenerateInput {
  class_id: string;
  subject_id?: string;
  chapter_ids?: string[];
  mcq_count?: number;
  short_count?: number;
  long_count?: number;
  easy_ratio?: number;
  medium_ratio?: number;
  hard_ratio?: number;
  mcq_marks?: number;
  short_marks?: number;
  long_marks?: number;
}

export interface AutoGenerateResult {
  questions: BankQuestion[];
  pool_size: number;
  picked: number;
  total_marks: number;
}
