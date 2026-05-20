import { serviceRequest } from "@/services/service-client";
import type { ServiceResult } from "@/types/core";

export interface Chapter {
  _id: string;
  class_id: string;
  subject_id: string;
  subject_name: string;
  title: string;
  chapter_number: number;
  status: string;
}

export function listChapters(params?: { class_id?: string; subject_id?: string; subject?: string }): Promise<ServiceResult<Chapter[]>> {
  const query = new URLSearchParams();
  if (params?.class_id) query.set("class_id", params.class_id);
  if (params?.subject_id) query.set("subject_id", params.subject_id);
  if (params?.subject) query.set("subject", params.subject);
  const qs = query.toString();
  return serviceRequest<Chapter[]>(`/api/chapters${qs ? `?${qs}` : ""}`);
}

export function createChapter(input: { class_id: string; subject_id?: string; subject_name?: string; title: string; chapter_number?: number }): Promise<ServiceResult<Chapter>> {
  return serviceRequest<Chapter>("/api/chapters", { method: "POST", body: JSON.stringify(input) });
}

export function archiveChapter(id: string): Promise<ServiceResult<Chapter>> {
  return serviceRequest<Chapter>(`/api/chapters/${id}/archive`, { method: "POST" });
}

export function reorderChapters(ids: string[]): Promise<ServiceResult<void>> {
  return serviceRequest<void>("/api/chapters/reorder", { method: "POST", body: JSON.stringify({ ids }) });
}

// ─── Draft API ───────────────────────────────────────────────────────────

export function saveDraft(data: any): Promise<ServiceResult<any>> {
  return serviceRequest<any>("/api/paper-drafts/save", { method: "POST", body: JSON.stringify(data) });
}

export function loadDraft(): Promise<ServiceResult<{ has_draft: boolean; data?: any; updated_at?: string }>> {
  return serviceRequest<any>("/api/paper-drafts/load");
}

export function discardDraft(): Promise<ServiceResult<any>> {
  return serviceRequest<any>("/api/paper-drafts", { method: "DELETE" });
}
