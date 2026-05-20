import { serviceRequest } from "@/services/service-client";
import type { ServiceResult } from "@/types/core";
import type { BankQuestion, CreateQuestionInput, QuestionFilters } from "../types/questionBank.types";

export function listQuestions(filters?: QuestionFilters): Promise<ServiceResult<BankQuestion[]>> {
  const params = new URLSearchParams();
  if (filters?.board) params.set("board", filters.board);
  if (filters?.class_id) params.set("class_id", filters.class_id);
  if (filters?.subject) params.set("subject", filters.subject);
  if (filters?.chapter) params.set("chapter", filters.chapter);
  if (filters?.type) params.set("type", filters.type);
  if (filters?.difficulty) params.set("difficulty", filters.difficulty);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.search) params.set("search", filters.search);
  const qs = params.toString();
  return serviceRequest<BankQuestion[]>(`/api/question-bank${qs ? `?${qs}` : ""}`);
}

export function createQuestion(input: CreateQuestionInput): Promise<ServiceResult<BankQuestion>> {
  return serviceRequest<BankQuestion>("/api/question-bank", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function archiveQuestion(id: string): Promise<ServiceResult<BankQuestion>> {
  return serviceRequest<BankQuestion>(`/api/question-bank/${id}/archive`, { method: "POST" });
}

export function restoreQuestion(id: string): Promise<ServiceResult<BankQuestion>> {
  return serviceRequest<BankQuestion>(`/api/question-bank/${id}/restore`, { method: "POST" });
}

export function starQuestion(id: string): Promise<ServiceResult<void>> {
  return serviceRequest<void>(`/api/question-bank/${id}/star`, { method: "POST" });
}

export function unstarQuestion(id: string): Promise<ServiceResult<void>> {
  return serviceRequest<void>(`/api/question-bank/${id}/unstar`, { method: "POST" });
}

export function getStarredIds(): Promise<ServiceResult<string[]>> {
  return serviceRequest<string[]>("/api/question-bank/starred");
}
