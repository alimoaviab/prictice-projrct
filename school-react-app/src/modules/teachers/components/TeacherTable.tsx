import { Badge, DataTable } from "@/components/ui";
import { TeacherRow } from "../types/teacher.types";

export function TeacherTable({ teachers }: { teachers: TeacherRow[] }) {
    const columns = [
        {
            key: "employee_no",
            label: "Employee No",
            render: (row: TeacherRow) => <div className="font-mono text-xs text-gray-500">{row.employee_no}</div>
        },
        {
            key: "name",
            label: "Name",
            render: (row: TeacherRow) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">{row.first_name} {row.last_name}</span>
                    <span className="text-xs text-gray-400">{row.email}</span>
                </div>
            )
        },
        {
            key: "phone",
            label: "Phone",
            render: (row: TeacherRow) => <div className="text-gray-600">{row.phone}</div>
        },
        {
            key: "qualification",
            label: "Qualification",
            render: (row: TeacherRow) => <div className="text-sm text-gray-600">{row.qualification || "—"}</div>
        },
        {
            key: "subjects",
            label: "Subjects",
            render: (row: TeacherRow) => (
                <div className="flex flex-wrap gap-1">
                    {row.subjects.map(s => (
                        <Badge key={s} variant="primary" className="text-[10px]">{s}</Badge>
                    ))}
                    {row.subjects.length === 0 && <span className="text-gray-400 italic text-xs">None</span>}
                </div>
            )
        },
        {
            key: "status",
            label: "Status",
            render: (row: TeacherRow) => (
                <Badge variant={row.status === "active" ? "success" : "gray"} className="normal-case">
                    {row.status}
                </Badge>
            )
        }
    ];

    return <DataTable columns={columns} rows={teachers} />;
}
