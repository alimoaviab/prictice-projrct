import { Badge, DataTable } from "@/components/ui";
import { AttendanceRecordRow } from "../types/attendance.types";

export function AttendanceTable({ rows }: { rows: AttendanceRecordRow[] }) {
    const columns = [
        {
            key: "date",
            label: "Date",
            render: (row: AttendanceRecordRow) => <div className="text-gray-600 font-medium">{row.date}</div>
        },
        {
            key: "student",
            label: "Student",
            render: (row: AttendanceRecordRow) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">{row.student_name}</span>
                    <span className="text-xs text-gray-400">ID: {row.admission_no}</span>
                </div>
            )
        },
        {
            key: "class",
            label: "Class",
            render: (row: AttendanceRecordRow) => <Badge variant="gray">{row.class_name}</Badge>
        },
        {
            key: "status",
            label: "Status",
            render: (row: AttendanceRecordRow) => {
                const variants: Record<string, any> = {
                    present: "success",
                    absent: "error",
                };
                return <Badge variant={variants[row.status] || "gray"} className="normal-case">{row.status}</Badge>;
            }
        },
        {
            key: "note",
            label: "Note",
            render: (row: AttendanceRecordRow) => (
                <div className="text-sm text-gray-500 italic max-w-[200px] truncate" title={row.note}>
                    {row.note || "—"}
                </div>
            )
        }
    ];

    return <DataTable columns={columns} rows={rows} />;
}
