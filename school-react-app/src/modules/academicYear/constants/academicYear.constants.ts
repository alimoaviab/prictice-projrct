export const ACADEMIC_YEAR_STATUS = {
    DRAFT: "draft",
    ACTIVE: "active",
    COMPLETED: "completed",
    CANCELLED: "cancelled"
} as const;

export const ACADEMIC_YEAR_TABLE_COLUMNS = [
    { header: "Year", key: "year", width: "15%" },
    { header: "Start Date", key: "start_date", width: "15%" },
    { header: "End Date", key: "end_date", width: "15%" },
    { header: "Status", key: "status", width: "20%" },
    { header: "Active", key: "is_active", width: "15%" },
    { header: "Actions", key: "actions", width: "20%" }
];
