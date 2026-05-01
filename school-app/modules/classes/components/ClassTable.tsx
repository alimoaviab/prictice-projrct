"use client";

import { Badge, DataTable } from "../../../components/ui";
import { ClassRow } from "../types/class.types";

export function ClassTable({ rows }: { rows: ClassRow[] }) {
    const columns = [
        {
            key: "name",
            label: "Class",
            render: (row: ClassRow) => <div className="font-semibold text-gray-900">{row.name}</div>
        },
        {
            key: "academy_care_year",
            label: "Academy Year",
            render: (row: ClassRow) => <div className="text-gray-600">{row.academy_care_year}</div>
        },
        {
            key: "subjects",
            label: "Subjects",
            render: (row: ClassRow) => (
                <div className="flex flex-wrap gap-1">
                    {row.subjects.map(s => (
                        <Badge key={s} variant="gray" className="text-[10px]">{s}</Badge>
                    ))}
                </div>
            )
        },
        {
            key: "teacher_names",
            label: "Teachers",
            render: (row: ClassRow) => {
                const teachers = row.teacher_names.filter(Boolean);
                return (
                    <div className="text-sm text-gray-600">
                        {teachers.length > 0 ? teachers.join(", ") : <span className="text-gray-400 italic">Unassigned</span>}
                    </div>
                );
            }
        },
        {
            key: "status",
            label: "Status",
            render: (row: ClassRow) => (
                <Badge variant={row.status === "active" ? "success" : "gray"} className="capitalize">
                    {row.status}
                </Badge>
            )
        }
    ];

    return <DataTable columns={columns} rows={rows} />;
}
