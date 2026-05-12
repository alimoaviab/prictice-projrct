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
    section?: string;
    code?: string;
    display_order?: number;
    passing_percentage?: number;
    academic_year_id: string;
    academic_year: string;
    subjects: string[];
    subject_ids?: string[];
    teacher_ids: string[];
    teacher_names: string[];
    room_number?: string;
    capacity?: number;
    description?: string;
    grade_thresholds?: GradeThreshold[];
    status: "active" | "inactive" | "archived";
    student_count?: number;
    attendance_percentage?: number;
}

export interface ClassFormInput {
    name: string;
    section?: string;
    code?: string;
    display_order: number;
    passing_percentage: number;
    academic_year_id: string;
    teacher_ids: string[];
    subject_ids?: string[];
    subjects?: any[];
    grade_thresholds?: GradeThreshold[];
    room_number?: string;
    capacity?: number;
    description?: string;
    status?: "active" | "inactive" | "archived";
}
