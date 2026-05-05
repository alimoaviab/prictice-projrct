import { serviceRequest } from "../../../services/service-client";
import { getAcademyCareQuery } from "../../../services/academy-care-context";
import { ClassFormInput, ClassRow } from "../types/class.types";

export function listClasses() {
    const query = getAcademyCareQuery();

    return (async () => {
        const filtered = await serviceRequest<ClassRow[]>(`/api/classes${query}`);

        if (!query || !filtered.ok || (filtered.data ?? []).length > 0) {
            return filtered;
        }

        // Fallback: selected year may be stale in localStorage; load all classes.
        return serviceRequest<ClassRow[]>("/api/classes");
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
