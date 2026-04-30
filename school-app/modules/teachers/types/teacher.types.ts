export interface TeacherRow {
    _id: string;
    employee_no: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    qualification?: string;
    subjects: string[];
    class_ids?: string[];
    status: "active" | "inactive" | "on_leave";
}

export interface TeacherFormInput {
    first_name: string;
    last_name?: string;
    email: string;
    phone: string;
    qualification?: string;
    subjects: string[];
    class_ids: string[];
    password: string;
}
