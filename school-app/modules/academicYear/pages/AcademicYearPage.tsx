"use client";

import { Badge, Button, Card, DataState, PageHeader, Skeleton, TableSkeleton } from "../../../components/ui";
import { AcademicYearForm } from "../components/AcademicYearForm";
import { AcademicYearTable } from "../components/AcademicYearTable";
import { useAcademicYears } from "../hooks/useAcademicYears";

export function AcademicYearPage() {
    const { state, addAcademicYear } = useAcademicYears();
    const data = state.data as any;
    const years: any[] = Array.isArray(data) ? data : (data?.data ?? []);
    const activeYear = years.find((year: any) => year.is_active);
    const completedYears = years.filter((year: any) => year.status === "completed").length;

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
                <Card className="premium-stat-card p-3 md:p-3.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Configured years</span>
                    <div className="mt-2 flex items-end justify-between gap-3">
                        <div>
                            <div className="text-2xl font-semibold tracking-tight text-slate-950">{years.length}</div>
                            <p className="mt-1 text-sm text-slate-600">Operational windows available.</p>
                        </div>
                        <div className="rounded-xl bg-blue-50 px-2.5 py-2 text-blue-700">
                            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                        </div>
                    </div>
                </Card>
                <Card className="premium-stat-card p-3 md:p-3.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Active session</span>
                    <div className="mt-2 flex items-end justify-between gap-3">
                        <div>
                            <div className="text-2xl font-semibold tracking-tight text-slate-950">{activeYear?.year ?? "None"}</div>
                            <p className="mt-1 text-sm text-slate-600">Current school operating window.</p>
                        </div>
                        <Badge variant={activeYear ? "success" : "gray"} className="whitespace-nowrap">
                            {activeYear ? "Active" : "Inactive"}
                        </Badge>
                    </div>
                </Card>
                <Card className="premium-stat-card p-3 md:p-3.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Completed</span>
                    <div className="mt-2 flex items-end justify-between gap-3">
                        <div>
                            <div className="text-2xl font-semibold tracking-tight text-slate-950">{completedYears}</div>
                            <p className="mt-1 text-sm text-slate-600">Closed academic cycles.</p>
                        </div>
                        <div className="rounded-xl bg-emerald-50 px-2.5 py-2 text-emerald-700">
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="max-w-4xl">
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight text-slate-950">Create Academic Year</h2>
                        <p className="mt-1 text-sm text-slate-600">Define a new academic session for the school.</p>
                    </div>
                    <Button variant="ghost" size="sm" className="hidden md:inline-flex">
                        Draft mode
                    </Button>
                </div>
                <AcademicYearForm onCreate={addAcademicYear as any} />
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

            {state.status === "success" && years.length > 0 ? (
                <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold tracking-tight text-slate-950">Academic Years List</h3>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                           {years.length} total
                        </span>
                    </div>
                    <AcademicYearTable years={years as any} onEdit={() => {}} onDelete={() => {}} onSetActive={() => {}} />
                </div>
            ) : null}
        </div>
    );
}
