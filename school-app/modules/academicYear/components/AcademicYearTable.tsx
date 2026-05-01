"use client";

import { Badge, Button, DataTable } from "../../../components/ui";
import { AcademicYearRow } from "../types/academicYear.types";

export function AcademicYearTable({ years }: { years: AcademicYearRow[] }) {
    const columns = [
        {
            key: "year",
            label: "Academic Year",
            render: (row: AcademicYearRow) => (
                <div className="font-semibold text-gray-900">{row.year}</div>
            )
        },
        {
            key: "start_date",
            label: "Start Date",
            render: (row: AcademicYearRow) => (
                <div className="text-gray-600">{new Date(row.start_date).toLocaleDateString()}</div>
            )
        },
        {
            key: "end_date",
            label: "End Date",
            render: (row: AcademicYearRow) => (
                <div className="text-gray-600">{new Date(row.end_date).toLocaleDateString()}</div>
            )
        },
        {
            key: "status",
            label: "Status",
            render: (row: AcademicYearRow) => {
                const variant = row.status === "active" ? "success" : row.status === "completed" ? "secondary" : "gray";
                return <Badge variant={variant} className="capitalize">{row.status}</Badge>;
            }
        },
        {
            key: "is_active",
            label: "Current",
            render: (row: AcademicYearRow) => (
                row.is_active ? (
                    <div className="flex items-center gap-1 text-success font-medium">
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        Active
                    </div>
                ) : <span className="text-gray-400">—</span>
            )
        },
        {
            key: "actions",
            label: "Actions",
            render: () => (
                <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/5">
                    Edit
                </Button>
            )
        }
    ];

    return <DataTable columns={columns} rows={years} />;
}
