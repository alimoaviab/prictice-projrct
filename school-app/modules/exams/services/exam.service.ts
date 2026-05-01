import { serviceRequest } from "../../../services/service-client";
import { ExamFormInput, ExamRow } from "../types/exam.types";

export function listExams() {
  return serviceRequest<ExamRow[]>("/api/exams");
}

export function createExam(input: ExamFormInput) {
  return serviceRequest<ExamRow>("/api/exams", {
    method: "POST",
    body: JSON.stringify(input)
  });
}