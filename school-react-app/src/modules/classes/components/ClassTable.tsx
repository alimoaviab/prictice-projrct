import { Badge, DataTable } from "@/components/ui";
import { ClassRow } from "../types/class.types";

export function ClassTable({ rows }: { rows: ClassRow[] }) {
    const columns = [
        {
            key: "name",
            label: "Class",
            render: (row: ClassRow) => <div className="font-bold text-slate-900">{row.name}</div>
        },
        {
            key: "academic_year",
            label: "Academic Year",
            render: (row: ClassRow) => <div className="text-[13px] font-medium text-slate-500">{row.academic_year}</div>
        },
        {
            key: "subjects",
            label: "Subjects",
            render: (row: ClassRow) => (
                <div className="flex flex-wrap gap-1">
                    {row.subjects.map(s => {
                        const name = typeof s === "string" ? s : s.name;
                        return <Badge key={name} variant="gray" className="text-[10px]">{name}</Badge>;
                    })}
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
    ];

    return <DataTable columns={columns} rows={rows} />;
}
