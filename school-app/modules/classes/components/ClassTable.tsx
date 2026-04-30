import { DataTable } from "../../../components/ui";
import { ClassRow } from "../types/class.types";

const columns = [
    {
        key: "name",
        label: "Class",
        render: (row: ClassRow) => row.name
    },
    {
        key: "academy_care_year",
        label: "Academy Care",
        render: (row: ClassRow) => row.academy_care_year
    },
    {
        key: "subjects",
        label: "Subjects",
        render: (row: ClassRow) => row.subjects.join(", ")
    },
    {
        key: "teacher_names",
        label: "Teachers",
        render: (row: ClassRow) => row.teacher_names.filter(Boolean).join(", ") || "Unassigned"
    },
    {
        key: "status",
        label: "Status",
        render: (row: ClassRow) => row.status
    }
];

export function ClassTable({ rows }: { rows: ClassRow[] }) {
    return <DataTable columns={columns} rows={rows} />;
}
