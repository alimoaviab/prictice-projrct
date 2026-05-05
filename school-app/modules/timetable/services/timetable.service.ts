import { serviceRequest } from "../../../services/service-client";
import { getAcademyCareQuery } from "../../../services/academy-care-context";
import { TimetableFormInput, TimetableRecord } from "../types/timetable.types";

export function listTimetable(filters?: { class_id?: string; teacher_id?: string; day_of_week?: number }) {
  const params = new URLSearchParams();
  if (filters?.class_id) params.set("class_id", filters.class_id);
  if (filters?.teacher_id) params.set("teacher_id", filters.teacher_id);
  if (filters?.day_of_week !== undefined) params.set("day_of_week", String(filters.day_of_week));

  const academyQuery = getAcademyCareQuery();
  const baseQuery = academyQuery ? academyQuery : "?";
  const finalQuery = params.toString() ? `${baseQuery}${academyQuery ? "&" : ""}${params.toString()}` : academyQuery;

  return serviceRequest<TimetableRecord[]>(`/api/timetable${finalQuery}`);
}

export function createTimetable(input: TimetableFormInput) {
  console.log("[TimetableService] Creating timetable with input:", input);

  // Validate required fields
  if (!input.class_id) throw new Error("Class ID is required");
  if (!input.teacher_id) throw new Error("Teacher ID is required");
  if (!input.subject_id) throw new Error("Subject ID is required");
  if (!input.day_of_week) throw new Error("Day is required");
  if (!input.period_number) throw new Error("Period number is required");
  if (!input.start_time) throw new Error("Start time is required");
  if (!input.end_time) throw new Error("End time is required");

  return serviceRequest<TimetableRecord>("/api/timetable", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateTimetable(id: string, input: Partial<TimetableFormInput>) {
  return serviceRequest<TimetableRecord>(`/api/timetable/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function deleteTimetable(id: string) {
  return serviceRequest<{ success: boolean; id: string }>(`/api/timetable/${id}`, {
    method: "DELETE"
  });
}

export function generateTimetable(config?: {
  daysPerWeek?: string[];
  startTime?: string;
  endTime?: string;
  slotDuration?: number;
}) {
  return serviceRequest<{
    generated: number;
    total: number;
    entries: TimetableRecord[];
  }>("/api/timetable/generate", {
    method: "POST",
    body: JSON.stringify(config || {})
  });
}

export function validateTimetable() {
  return serviceRequest<{
    total: number;
    conflicts: number;
    details: Array<{
      type: string;
      message: string;
      entry_id?: string;
    }>;
  }>("/api/timetable/validate");
}
