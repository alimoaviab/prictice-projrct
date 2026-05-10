"use client";

import { Badge, Button, Card, DataState, PageHeader, Skeleton, TableSkeleton } from "../../../components/ui";
import { AcademicYearForm } from "../components/AcademicYearForm";
import { AcademicYearTable } from "../components/AcademicYearTable";
import { AcademicYearRow } from "../types/academicYear.types";
import { useAcademicYears } from "../hooks/useAcademicYears";

export function AcademicYearPage() {
    const { state, addAcademicYear, updateAcademicYear, deleteAcademicYear } = useAcademicYears();
    const years = state.data?.data ?? [];
    const activeYear = years.find((year: AcademicYearRow) => year.is_active);
    const completedYears = years.filter((year: AcademicYearRow) => year.status === "completed").length;

    const handleEdit = (row: AcademicYearRow) => {
        // Implementation for editing (e.g., opening a modal or populating form)
        console.log("Edit academic year:", row);
    };

    const handleDelete = async (row: AcademicYearRow) => {
        if (confirm(`Are you sure you want to delete academic year ${row.year}?`)) {
            await deleteAcademicYear(row._id);
        }
    };

    const handleSetActive = async (row: AcademicYearRow) => {
        if (row.is_active) return;
        if (confirm(`Set ${row.year} as the active academic year?`)) {
            await updateAcademicYear(row._id, { is_active: true } as any);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <PageHeader
                title="Academic Years"
                description="Define and manage institutional year windows with clear status, timing, and control."
                actions={
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Active</span>
                            <span className="text-sm font-semibold text-slate-950">{activeYear?.year ?? "None"}</span>
                        </div>
                        <div className="h-8 w-px bg-slate-200" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Total</span>
                            <span className="text-sm font-semibold text-slate-950">{years.length}</span>
                        </div>
                    </div>
                }
            />

            <div className="grid gap-3 sm:grid-cols-3">
                <Card className="p-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Configured years</span>
                    <div className="mt-1.5 flex items-end justify-between gap-3">
                        <div>
                            <div className="text-xl font-black tracking-tight text-slate-900">{years.length}</div>
                            <p className="mt-0.5 text-[11px] font-medium text-slate-500">Operational windows.</p>
                        </div>
                        <div className="rounded-lg bg-blue-50 px-2 py-1.5 text-blue-600">
                            <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                        </div>
                    </div>
                </Card>
                <Card className="p-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Active session</span>
                    <div className="mt-1.5 flex items-end justify-between gap-3">
                        <div>
                            <div className="text-xl font-black tracking-tight text-slate-900">{activeYear?.year ?? "None"}</div>
                            <p className="mt-0.5 text-[11px] font-medium text-slate-500">Current window.</p>
                        </div>
                        <Badge variant={activeYear ? "success" : "gray"} className="text-[10px] px-1.5 py-0">
                            {activeYear ? "Active" : "Inactive"}
                        </Badge>
                    </div>
                </Card>
                <Card className="p-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Completed</span>
                    <div className="mt-1.5 flex items-end justify-between gap-3">
                        <div>
                            <div className="text-xl font-black tracking-tight text-slate-900">{completedYears}</div>
                            <p className="mt-0.5 text-[11px] font-medium text-slate-500">Closed cycles.</p>
                        </div>
                        <div className="rounded-lg bg-emerald-50 px-2 py-1.5 text-emerald-600">
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="max-w-4xl p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold tracking-tight text-slate-900 leading-none">Create Academic Year</h2>
                        <p className="mt-1 text-[13px] font-medium text-slate-500">Define a new academic session window.</p>
                    </div>
                    <Button variant="ghost" size="sm" className="hidden md:inline-flex text-[11px] h-7">
                        Draft mode
                    </Button>
                </div>
                <AcademicYearForm onCreate={addAcademicYear} />
            </Card>

            {state.status === "loading" || state.status === "idle" ? (
                     <div className="space-y-3">
                   <Skeleton className="h-8 w-48" />
                   <TableSkeleton />
                </div>
            ) : null}

            {state.status === "error" ? (
                <DataState variant="error" title="Academic years unavailable" message={state.error} />
            ) : null}

            {state.status === "empty" ? (
                <DataState variant="empty" title="No academic years found" message="Create the first academic year for this school." />
            ) : null}

            {state.status === "success" && state.data && state.data.data.length > 0 ? (
                <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold tracking-tight text-slate-950">Academic Years List</h3>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                           {state.data.data.length} total
                        </span>
                    </div>
                    <AcademicYearTable 
                        years={state.data.data} 
                        onEdit={handleEdit} 
                        onDelete={handleDelete} 
                        onSetActive={handleSetActive}
                    />
                </div>
            ) : null}
        </div>
    );
}
