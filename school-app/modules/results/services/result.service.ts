import { serviceRequest } from "../../../services/service-client";
import { ResultFormInput, ResultRow } from "../types/result.types";

export function listResults() {
  return serviceRequest<ResultRow[]>("/api/results");
}

export function saveResult(input: ResultFormInput) {
  return serviceRequest<ResultRow>("/api/results", {
    method: "POST",
    body: JSON.stringify(input)
  });
}