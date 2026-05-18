import { Badge, DataTable } from "@/components/ui";
import { ResultRow } from "../types/result.types";

export function ResultTable({ rows }: { rows: ResultRow[] }) {
    const columns = [
        {
            key: "student",
            label: "Student",
            render: (row: ResultRow) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">{row.student_name}</span>
                    <span className="text-xs text-gray-400">ID: {row.admission_no}</span>
                </div>
            )
        },
        {
            key: "exam",
            label: "Exam / Subject",
            render: (row: ResultRow) => {
                const count = row.subjects && row.subjects.length > 0
                    ? row.subjects.length
                    : (row.exam_subject ? row.exam_subject.split(",").filter(s => s.trim()).length : 0);
                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700">{row.exam_title}</span>
                        <span className="text-xs text-primary">{count} {count === 1 ? "subject" : "subjects"}</span>
                    </div>
                );
            }
        },
        {
            key: "marks",
            label: "Marks Obtained",
            render: (row: ResultRow) => (
                <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">{row.obtained_marks}</span>
                    <span className="text-gray-400">/ {row.max_marks}</span>
                </div>
            )
        },
        {
            key: "grade",
            label: "Grade",
            render: (row: ResultRow) => <Badge variant="primary">{row.grade}</Badge>
        },
        {
            key: "percentage",
            label: "Percentage",
            render: (row: ResultRow) => {
                const percentage = Math.round((row.obtained_marks / row.max_marks) * 100);
                const variant = percentage >= 80 ? "success" : percentage >= 40 ? "warning" : "error";
                return (
                    <div className="flex flex-col gap-1">
                        <Badge variant={variant}>{percentage}%</Badge>
                        <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${variant === 'success' ? 'bg-success' : variant === 'warning' ? 'bg-warning' : 'bg-error'}`}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </div>
                );
            }
        },
        {
            key: "remarks",
            label: "Remarks",
            render: (row: ResultRow) => (
                <div className="text-sm text-gray-500 italic truncate max-w-[150px]" title={row.remarks}>
                    {row.remarks || "—"}
                </div>
            )
        }
    ];

    return <DataTable columns={columns} rows={rows} />;
}
