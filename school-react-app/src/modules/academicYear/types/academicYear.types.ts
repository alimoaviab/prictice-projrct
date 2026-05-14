export interface AcademicYearRow {
    _id: string;
    school_id: string;
    year: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    status: "draft" | "active" | "completed" | "cancelled";
    description?: string;
}

export interface AcademicYearFormInput {
    year: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    description?: string;
}

export interface AcademicYearUpdateInput extends Partial<AcademicYearFormInput> { }
