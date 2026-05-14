import { Badge, DataTable } from "@/components/ui";
import { StudentRow } from "../types/student.types";

export function StudentTable({ students }: { students: StudentRow[] }) {
    const columns = [
        {
            key: "admission_no",
            label: "Admission No",
            render: (row: StudentRow) => <div className="font-mono text-xs text-gray-500">{row.admission_no}</div>
        },
        {
            key: "name",
            label: "Name",
            render: (row: StudentRow) => (
                <div className="font-semibold text-gray-900">{row.first_name} {row.last_name}</div>
            )
        },
        {
            key: "class",
            label: "Class / Section",
            render: (row: StudentRow) => (
                <div className="flex items-center gap-2">
                    <span className="text-gray-700">{row.class_id}</span>
                    <Badge variant="secondary">{row.section}</Badge>
                </div>
            )
        },
        {
            key: "guardian",
            label: "Guardian",
            render: (row: StudentRow) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">{row.guardian.name}</span>
                    <span className="text-xs text-gray-400">{row.guardian.phone}</span>
                </div>
            )
        },
        {
            key: "status",
            label: "Status",
            render: (row: StudentRow) => (
                <Badge variant={row.status === "active" ? "success" : "gray"} className="normal-case">
                    {row.status}
                </Badge>
            )
        }
    ];

    return <DataTable columns={columns} rows={students} />;
}
