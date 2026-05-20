import { serviceRequest } from "@/services/service-client";
import type { ServiceResult } from "@/types/core";
import type { QuestionPaper, QuestionPaperFormInput } from "../types/questionPaper.types";

export function listQuestionPapers(): Promise<ServiceResult<QuestionPaper[]>> {
  return serviceRequest<QuestionPaper[]>("/api/question-papers");
}

export function getQuestionPaper(id: string): Promise<ServiceResult<QuestionPaper>> {
  return serviceRequest<QuestionPaper>(`/api/question-papers/${id}`);
}

export function createQuestionPaper(input: QuestionPaperFormInput): Promise<ServiceResult<QuestionPaper>> {
  return serviceRequest<QuestionPaper>("/api/question-papers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateQuestionPaper(id: string, input: Partial<QuestionPaperFormInput>): Promise<ServiceResult<QuestionPaper>> {
  return serviceRequest<QuestionPaper>(`/api/question-papers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteQuestionPaper(id: string): Promise<ServiceResult<void>> {
  return serviceRequest<void>(`/api/question-papers/${id}`, { method: "DELETE" });
}
