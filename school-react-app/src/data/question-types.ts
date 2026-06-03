import questionTypeConfig from "../../../data/question-types.json";

export interface QuestionTypeConfig {
  id: string;
  label: string;
  category: string;
  defaultMarks: number;
  aliases: string[];
}

export interface SelectOption {
  id: string;
  label: string;
}

export const QUESTION_TYPES = questionTypeConfig.questionTypes as QuestionTypeConfig[];

export function getQuestionTypeOptions(): SelectOption[] {
  return QUESTION_TYPES.map((type) => ({
    id: type.id,
    label: type.label,
  }));
}

export function normalizeQuestionTypeId(value?: string | null): string {
  const key = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_");

  const matched = QUESTION_TYPES.find(
    (type) =>
      type.id === key ||
      type.aliases.some((alias) => alias.trim().toLowerCase().replace(/\s+/g, "_") === key),
  );
  return matched?.id || key;
}

export function getQuestionTypeLabel(typeId: string): string {
  const normalized = normalizeQuestionTypeId(typeId);
  return QUESTION_TYPES.find((type) => type.id === normalized)?.label || typeId;
}
