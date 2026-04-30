import { serviceRequest } from "../../../services/service-client";
import { TeacherFormInput, TeacherRow } from "../types/teacher.types";

export function listTeachers() {
    return serviceRequest<TeacherRow[]>("/api/teachers");
}

export function createTeacher(input: TeacherFormInput) {
    return serviceRequest<TeacherRow>("/api/teachers", {
        method: "POST",
        body: JSON.stringify(input)
    });
}
