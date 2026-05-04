import { serviceRequest } from "../../../services/service-client";
import { SubjectRow, SubjectFormInput } from "../types";

export function listSubjects() {
    return serviceRequest<SubjectRow[]>("/api/subjects");
}

export function getSubject(id: string) {
    return serviceRequest<SubjectRow>(`/api/subjects/${id}`);
}

export function createSubject(input: SubjectFormInput) {
    return serviceRequest<SubjectRow>("/api/subjects", {
        method: "POST",
        body: JSON.stringify(input)
    });
}

export function updateSubject(id: string, input: Partial<SubjectFormInput>) {
    return serviceRequest<SubjectRow>(`/api/subjects/${id}`, {
        method: "PUT",
        body: JSON.stringify(input)
    });
}

export function deleteSubject(id: string) {
    return serviceRequest<{ success: boolean; id: string }>(`/api/subjects/${id}`, {
        method: "DELETE"
    });
}
