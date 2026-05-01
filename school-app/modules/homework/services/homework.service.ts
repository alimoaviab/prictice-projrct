import { serviceRequest } from "../../../services/service-client";
import { HomeworkFormInput, HomeworkRecordRow } from "../types/homework.types";

export function listHomework() {
  return serviceRequest<HomeworkRecordRow[]>("/api/homework");
}

export function createHomework(input: HomeworkFormInput) {
  return serviceRequest<HomeworkRecordRow>("/api/homework", {
    method: "POST",
    body: JSON.stringify(input)
  });
}
