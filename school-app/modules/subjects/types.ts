export interface SubjectRow {
    _id: string;
    name: string;
    code?: string;
    description?: string;
    status: "active" | "inactive";
    total_marks?: number;
    passing_marks?: number;
    teacher_name?: string;
    class_mapping?: string[];
    academic_year?: string;
    createdAt?: string;
    updatedAt?: string;
}

export type SubjectFormInput = Omit<SubjectRow, "_id" | "createdAt" | "updatedAt">;
