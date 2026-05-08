import { serviceRequest } from "../../../services/service-client";
import { AcademyYear, AcademyYearFormInput } from "../types/academyCare.types";

export function listAcademyYears() {
    return serviceRequest<{
        items: AcademyYear[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>("/api/academic-years");
}

export function createAcademyYear(input: AcademyYearFormInput) {
    return serviceRequest<AcademyYear>("/api/academic-years", {
        method: "POST",
        body: JSON.stringify(input)
    });
}

export function updateAcademyYear(id: string, input: Partial<AcademyYearFormInput>) {
    return serviceRequest<AcademyYear>(`/api/academic-years/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input)
    });
}

export function deleteAcademyYear(id: string) {
    return serviceRequest<{ success: boolean; id: string }>(`/api/academic-years/${id}`, {
        method: "DELETE"
    });
}
