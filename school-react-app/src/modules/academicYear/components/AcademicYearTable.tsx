import { Badge, Button, DataTable, type DataTableColumn } from "@/components/ui";
import { AcademicYearRow } from "../types/academicYear.types";

export function AcademicYearTable({ 
    years, 
    onEdit, 
    onDelete,
    onSetActive
}: { 
    years: AcademicYearRow[]; 
    onEdit: (row: AcademicYearRow) => void;
    onDelete: (row: AcademicYearRow) => void;
    onSetActive: (row: AcademicYearRow) => void;
}) {
    const formatDate = (value: string) => new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    const columns: DataTableColumn<AcademicYearRow>[] = [
        {
            key: "year",
            label: "Session",
            width: "25%",
            render: (row: AcademicYearRow) => (
                <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${row.is_active ? 'bg-blue-600 animate-pulse' : 'bg-slate-200'}`} />
                    <span className="font-bold text-slate-900 tracking-tight text-sm">{row.year}</span>
                </div>
            )
        },
        {
            key: "duration",
            label: "Academic Timeline",
            width: "25%",
            render: (row: AcademicYearRow) => (
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                    <span className="bg-slate-50 px-2 py-1 rounded border border-slate-100">{formatDate(row.start_date)}</span>
                    <span className="text-slate-300">→</span>
                    <span className="bg-slate-50 px-2 py-1 rounded border border-slate-100">{formatDate(row.end_date)}</span>
                </div>
            )
        },
        {
            key: "days",
            label: "Total Days",
            width: "20%",
            render: (row: AcademicYearRow) => {
                const start = new Date(row.start_date);
                const end = new Date(row.end_date);
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return (
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-300 text-sm">date_range</span>
                        <span className="text-xs font-bold text-slate-600">{diffDays} Days</span>
                    </div>
                );
            }
        },
        {
            key: "status",
            label: "Status",
            width: "25%",
            render: (row: AcademicYearRow) => {
                const colors = row.status === "active" ? "text-emerald-700 bg-emerald-50 border-emerald-100" : row.status === "completed" ? "text-blue-700 bg-blue-50 border-blue-100" : "text-slate-400 bg-slate-50 border-slate-100";
                return (
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold normal-case  border ${colors}`}>
                        {row.status}
                    </span>
                );
            }
        },
        {
            key: "actions",
            label: "Actions",
            width: "15%",
            align: "right",
            render: (row: AcademicYearRow) => (
                <div className="flex justify-end items-center gap-1.5 py-1">
                    <button 
                        onClick={() => onSetActive(row)}
                        className={`h-8 px-3 flex items-center justify-center gap-2 rounded-lg transition-all border text-[9px] font-bold normal-case  ${
                            row.is_active 
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/10" 
                            : "bg-white text-slate-400 border-slate-200 hover:border-blue-400 hover:text-blue-600"
                        }`}
                        title={row.is_active ? "Current Active Year" : "Set as Current"}
                    >
                        <span className="material-symbols-outlined text-[16px]">{row.is_active ? "check_circle" : "radio_button_unchecked"}</span>
                        {row.is_active ? "Active" : "Inactive"}
                    </button>
                    <div className="w-px h-3 bg-slate-100 mx-0.5" />
                    <button 
                        onClick={() => onEdit(row)}
                        className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                        title="Edit"
                    >
                        <span className="material-symbols-outlined text-[18px]">edit_note</span>
                    </button>
                    {/* 
                    <button 
                        onClick={() => onDelete(row)}
                        className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Delete"
                    >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                    */}
                    <div className="w-px h-3 bg-slate-100 mx-0.5" />
                    <button 
                        onClick={() => onEdit(row)}
                        className="h-7 px-3 rounded bg-blue-600 text-[10px] font-bold normal-case  text-white hover:bg-blue-700 transition-all shadow-sm active:scale-95"
                    >
                        Open
                    </button>
                </div>
            )
        }
    ];

    return <DataTable columns={columns} rows={years} />;
}
