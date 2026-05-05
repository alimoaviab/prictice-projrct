import { serviceRequest } from "../../../services/service-client";
import { getAcademyCareQuery } from "../../../services/academy-care-context";
import { TeacherFormInput, TeacherRow } from "../types/teacher.types";

export function listTeachers() {
    const query = getAcademyCareQuery();

    return (async () => {
        const filtered = await serviceRequest<TeacherRow[]>(`/api/teachers${query}`);

        if (!query || !filtered.ok || (filtered.data ?? []).length > 0) {
            return filtered;
        }

        return serviceRequest<TeacherRow[]>("/api/teachers");
    })();
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
