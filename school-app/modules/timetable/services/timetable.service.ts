import { TimetableFormInput, TimetableRecord } from "../types/timetable.types";
import { serviceRequest } from "../../../services/service-client";
import { getAcademicYearQuery } from "../../../services/academic-year-context";

interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: { message: string };
}

export function listTimetable(filters?: any): Promise<ApiResponse<TimetableRecord[]>> {
  const query = getAcademicYearQuery();
  const searchParams = new URLSearchParams(filters || {});
  // remove leading '?' if any, getAcademicYearQuery adds '?' or '&'
  const filterString = searchParams.toString();
  const queryString = query ? `${query}${filterString ? '&' + filterString : ''}` : `?${filterString}`;
  return serviceRequest<TimetableRecord[]>(`/api/timetable${queryString}`);
}

export function createTimetable(input: TimetableFormInput): Promise<ApiResponse<TimetableRecord>> {
  return serviceRequest<TimetableRecord>("/api/timetable", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateTimetable(id: string, input: Partial<TimetableFormInput>): Promise<ApiResponse<TimetableRecord>> {
  return serviceRequest<TimetableRecord>(`/api/timetable/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function deleteTimetable(id: string): Promise<ApiResponse<void>> {
  return serviceRequest<void>(`/api/timetable/${id}`, {
    method: "DELETE"
  });
}

export function getTimetable(id: string): Promise<ApiResponse<TimetableRecord>> {
  return serviceRequest<TimetableRecord>(`/api/timetable/${id}`);
}
