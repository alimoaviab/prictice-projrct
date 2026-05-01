"use client";

import { Badge, DataTable } from "../../../components/ui";
import { AcademyYear } from "../types/academyCare.types";

export function AcademyCareTable({ years }: { years: AcademyYear[] }) {
    const columns = [
        {
            key: "year",
            label: "Session Year",
            render: (row: AcademyYear) => <div className="font-bold text-gray-900">{row.year}</div>
        },
        {
            key: "dates",
            label: "Duration",
            render: (row: AcademyYear) => (
                <div className="flex items-center gap-2 text-gray-600">
                    <span>{new Date(row.start_date).toLocaleDateString()}</span>
                    <span className="material-symbols-outlined text-xs text-gray-300">arrow_forward</span>
                    <span>{new Date(row.end_date).toLocaleDateString()}</span>
                </div>
            )
        },
        {
            key: "status",
            label: "Status",
            render: (row: AcademyYear) => (
                <Badge variant={row.status === "active" ? "success" : "gray"} className="capitalize">
                    {row.status}
                </Badge>
            )
        },
        {
            key: "actions",
            label: "Actions",
            render: () => (
                <div className="flex gap-2">
                    <button className="p-1 hover:bg-gray-100 rounded text-primary">
                        <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button className="p-1 hover:bg-red-50 rounded text-error">
                        <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                </div>
            )
        }
    ];

    return <DataTable columns={columns} rows={years} />;
}
