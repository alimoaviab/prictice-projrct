export interface ClassRow {
    _id: string;
    name: string;
    academy_care_id: string;
    academy_care_year: string;
    subjects: string[];
    teacher_ids: string[];
    teacher_names: string[];
    room_number?: string;
    description?: string;
    status: "active" | "archived";
}

export interface ClassFormInput {
    name: string;
    academy_care_id: string;
    teacher_ids: string[];
    subjects: string[];
    room_number?: string;
    description?: string;
}
