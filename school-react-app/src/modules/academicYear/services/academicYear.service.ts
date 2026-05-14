import { serviceRequest } from "@/services/service-client";
import { AcademicYearFormInput, AcademicYearRow, AcademicYearUpdateInput } from "../types/academicYear.types";

export function listAcademicYears(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    
    const queryString = query.toString();
    const url = `/api/academic-years${queryString ? `?${queryString}` : ""}`;
    
    return serviceRequest<{ items: AcademicYearRow[]; total: number; page: number; limit: number; pages: number }>(url);
}

export function createAcademicYear(input: AcademicYearFormInput) {
    return serviceRequest<AcademicYearRow>("/api/academic-years", {
        method: "POST",
        body: JSON.stringify(input)
    });
}

export function updateAcademicYear(id: string, input: AcademicYearUpdateInput) {
    return serviceRequest<AcademicYearRow>(`/api/academic-years/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input)
    });
}

export function deleteAcademicYear(id: string) {
    return serviceRequest<{ success: boolean; id: string }>(`/api/academic-years/${id}`, {
        method: "DELETE"
    });
}
