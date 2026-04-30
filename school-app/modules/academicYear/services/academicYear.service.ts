import { serviceRequest } from "../../../services/service-client";
import { AcademicYearFormInput, AcademicYearRow, AcademicYearUpdateInput } from "../types/academicYear.types";

export function listAcademicYears() {
    return serviceRequest<AcademicYearRow[]>("/api/academic-years");
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
