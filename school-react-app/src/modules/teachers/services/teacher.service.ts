import { serviceRequest } from "@/services/service-client";
import { getAcademicYearQuery } from "@/services/academic-year-context";
import { TeacherFormInput, TeacherRow } from "../types/teacher.types";
import type { Paginated } from "@/types/pagination";

export interface TeacherListParams {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
}

/**
 * Lists teachers. When `page`/`limit` are passed, returns the paginated
 * envelope `{ items, total, page, limit, pages }` from the backend.
 * When omitted, returns a plain array (legacy callers).
 */
export function listTeachers(params: TeacherListParams = {}) {
    const yearQ = getAcademicYearQuery(); // "" or "?academic_year_id=..."
    const search = new URLSearchParams();
    if (params.page) search.set("page", String(params.page));
    if (params.limit) search.set("limit", String(params.limit));
    if (params.status && params.status !== "all") search.set("status", params.status);
    if (params.search) search.set("search", params.search);
    const filterStr = search.toString();
    const query = yearQ
        ? filterStr
            ? `${yearQ}&${filterStr}`
            : yearQ
        : filterStr
            ? `?${filterStr}`
            : "";
    if (params.page || params.limit) {
        return serviceRequest<Paginated<TeacherRow>>(`/api/teachers${query}`);
    }
    return serviceRequest<TeacherRow[]>(`/api/teachers${query}`);
}

export function getTeacher(id: string) {
    return serviceRequest<TeacherRow>(`/api/teachers/${id}`);
}

export function createTeacher(input: TeacherFormInput) {
    return serviceRequest<TeacherRow>("/api/teachers", {
        method: "POST",
        body: JSON.stringify(input)
    });
}

export function updateTeacher(id: string, input: Partial<TeacherFormInput>) {
    return serviceRequest<TeacherRow>(`/api/teachers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input)
    });
}

export function deleteTeacher(id: string) {
    return serviceRequest<{ success: boolean; id: string }>(`/api/teachers/${id}`, {
        method: "DELETE"
    });
}
