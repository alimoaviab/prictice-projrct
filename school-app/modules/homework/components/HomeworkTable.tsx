"use client";

import { Badge, DataTable } from "../../../components/ui";
import { HomeworkRecordRow } from "../types/homework.types";

export function HomeworkTable({ rows }: { rows: HomeworkRecordRow[] }) {
    const columns = [
        {
            key: "due_at",
            label: "Due Date",
            render: (row: HomeworkRecordRow) => (
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-gray-400">event</span>
                    <span className="text-gray-600 font-medium">{row.due_at}</span>
                </div>
            )
        },
        {
            key: "title",
            label: "Title / Subject",
            render: (row: HomeworkRecordRow) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">{row.title}</span>
                    <span className="text-xs text-primary">{row.subject_name}</span>
                </div>
            )
        },
        {
            key: "class",
            label: "Class",
            render: (row: HomeworkRecordRow) => <Badge variant="secondary">{row.class_name}</Badge>
        },
        {
            key: "teacher",
            label: "Teacher",
            render: (row: HomeworkRecordRow) => (
                <div className="text-sm text-gray-600">
                    {row.teacher_name}
                    <div className="text-[10px] text-gray-400">{row.teacher_employee_no}</div>
                </div>
            )
        },
        {
            key: "status",
            label: "Status",
            render: (row: HomeworkRecordRow) => {
                const variants: Record<string, any> = {
                    assigned: "primary",
                    draft: "gray",
                    closed: "success"
                };
                return <Badge variant={variants[row.status] || "gray"} className="capitalize">{row.status}</Badge>;
            }
        }
    ];

    return <DataTable columns={columns} rows={rows} />;
}
