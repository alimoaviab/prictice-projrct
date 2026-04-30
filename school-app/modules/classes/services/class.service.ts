import { serviceRequest } from "../../../services/service-client";
import { ClassFormInput, ClassRow } from "../types/class.types";

export function listClasses() {
    return serviceRequest<ClassRow[]>("/api/classes");
}

export function createClass(input: ClassFormInput) {
    return serviceRequest<ClassRow>("/api/classes", {
        method: "POST",
        body: JSON.stringify(input)
    });
}
