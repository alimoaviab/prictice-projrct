export interface ClassSubject {
    name: string;
    total_marks: number;
    passing_marks: number;
}

export interface GradeThreshold {
    grade: string;
    min_score: number;
    max_score: number;
    description: string;
}

export interface ClassRow {
    _id: string;
    name: string;
    code?: string;
    display_order?: number;
    passing_percentage?: number;
    academy_care_id: string;
    academy_care_year: string;
    subjects: string[] | ClassSubject[];
    teacher_ids: string[];
    teacher_names: string[];
    room_number?: string;
    description?: string;
    grade_thresholds?: GradeThreshold[];
    status: "active" | "archived";
    student_count?: number;
    attendance_percentage?: number;
}

export interface ClassFormInput {
    name: string;
    code: string;
    display_order: number;
    passing_percentage: number;
    academy_care_id: string;
    teacher_ids: string[];
    subjects: ClassSubject[];
    grade_thresholds: GradeThreshold[];
    room_number?: string;
    description?: string;
    status?: "active" | "inactive";
}

