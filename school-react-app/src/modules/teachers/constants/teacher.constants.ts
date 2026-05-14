export const TEACHER_STATUS = {
    ACTIVE: "active",
    INACTIVE: "inactive",
    ON_LEAVE: "on_leave"
} as const;

export const TEACHER_TABLE_COLUMNS = [
    { header: "Employee No", key: "employee_no", width: "15%" },
    { header: "Name", key: "name", width: "20%" },
    { header: "Email", key: "email", width: "25%" },
    { header: "Subjects", key: "subjects", width: "20%" },
    { header: "Status", key: "status", width: "15%" },
    { header: "Actions", key: "actions", width: "5%" }
];
