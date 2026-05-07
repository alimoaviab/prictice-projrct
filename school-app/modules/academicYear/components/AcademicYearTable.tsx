"use client";

import { Badge, Button, DataTable } from "../../../components/ui";
import { AcademicYearRow } from "../types/academicYear.types";

export function AcademicYearTable({ years }: { years: AcademicYearRow[] }) {
    const formatDate = (value: string) => new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    const columns = [
        {
            key: "year",
            label: "Session",
            render: (row: AcademicYearRow) => (
                <div className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${row.is_active ? 'bg-blue-600 animate-pulse' : 'bg-slate-200'}`} />
                    <span className="font-black text-slate-900 tracking-tight">{row.year}</span>
                </div>
            )
        },
        {
            key: "duration",
            label: "Timeline",
            render: (row: AcademicYearRow) => (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                    <span className="material-symbols-outlined text-sm">event</span>
                    {formatDate(row.start_date)}
                    <span className="text-slate-300">→</span>
                    {formatDate(row.end_date)}
                </div>
            )
        },
        {
            key: "status",
            label: "State",
            render: (row: AcademicYearRow) => {
                const colors = row.status === "active" ? "text-emerald-700 bg-emerald-50 border-emerald-100" : row.status === "completed" ? "text-blue-700 bg-blue-50 border-blue-100" : "text-slate-400 bg-slate-50 border-slate-100";
                return (
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${colors}`}>
                        {row.status}
                    </span>
                );
            }
        },
        {
            key: "sync",
            label: "Sync",
            render: () => (
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <span className="material-symbols-outlined text-sm">sync</span>
                    Healthy
                </div>
            )
        },
        {
            key: "actions",
            label: "",
            render: () => (
                <div className="flex justify-end">
                    <button className="h-7 px-2 rounded border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                        Details
                    </button>
                </div>
            )
        }
    ];

    return <DataTable columns={columns} rows={years} />;
}
