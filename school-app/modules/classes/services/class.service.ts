import { serviceRequest } from "../../../services/service-client";
import { getAcademicYearQuery } from "../../../services/academic-year-context";
import { ClassFormInput, ClassRow } from "../types/class.types";

export function listClasses() {
    const query = getAcademicYearQuery();

    return (async () => {
    return serviceRequest<ClassRow[]>(`/api/classes${query}`);
    })();
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
