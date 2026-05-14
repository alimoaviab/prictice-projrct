import { serviceRequest } from "@/services/service-client";
import { getAcademicYearQuery } from "@/services/academic-year-context";
import { ClassFormInput, ClassRow } from "../types/class.types";

export interface ClassListResponse {
    data: ClassRow[];
    meta: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

export function listClasses(params?: { page?: number; limit?: number }) {
    const baseQuery = getAcademicYearQuery();
    const query = new URLSearchParams(baseQuery.replace('?', ''));
    
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    
    const queryString = query.toString();
    const url = `/api/classes${queryString ? `?${queryString}` : ""}`;

    return serviceRequest<ClassListResponse>(url);
}

export function getClass(id: string) {
    return serviceRequest<ClassRow>(`/api/classes/${id}`);
}

export function createClass(input: ClassFormInput) {
    return serviceRequest<ClassRow>("/api/classes", {
        method: "POST",
        body: JSON.stringify(input)
    });
}

export function updateClass(id: string, input: Partial<ClassFormInput>) {
    return serviceRequest<ClassRow>(`/api/classes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input)
    });
}

export function deleteClass(id: string) {
    return serviceRequest<{ success: boolean; id: string }>(`/api/classes/${id}`, {
        method: "DELETE"
    });
}
