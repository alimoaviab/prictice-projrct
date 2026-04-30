import { serviceRequest } from "../../../services/service-client";
import { AcademyYear, AcademyYearFormInput } from "../types/academyCare.types";

export function listAcademyYears() {
    return serviceRequest<AcademyYear[]>("/api/academic-years");
}

export function createAcademyYear(input: AcademyYearFormInput) {
    return serviceRequest<AcademyYear>("/api/academic-years", {
        method: "POST",
        body: JSON.stringify(input)
    });
}
