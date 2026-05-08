"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { Card, DataState, Skeleton, TableSkeleton, Badge, DataTable, DataTableColumn, RowAction } from "../../../components/ui";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { serviceRequest } from "../../../services/service-client";
import { ResultForm } from "../components/ResultForm";
import { useResults } from "../hooks/useResults";
import { ResultRow } from "../types/result.types";

export function ResultPage() {
    const { state, addResult } = useResults();
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");
    const [isAdding, setIsAdding] = useState(false);
    const { state: examState, run: runExams } = useSafeAsync<Array<{ _id: string; title: string; subject: string; class_name?: string; class_id?: string }>>();
    const { state: studentState, run: runStudents } = useSafeAsync<
        Array<{ _id: string; first_name: string; last_name: string; admission_no: string; class_id: string }>
    >();

    const loadExams = useCallback(() => {
        return runExams(async () => {
            const result = await serviceRequest<Array<{ _id: string; title: string; subject: string; class_name?: string; class_id?: string }>>("/api/exams");
            if (!result.ok) {
                throw new Error(result.error.message || "Failed to load exams");
            }

            return result.data;
        });
    }, [runExams]);

    const loadStudents = useCallback(() => {
        return runStudents(async () => {
            const result = await serviceRequest<
                Array<{ _id: string; first_name: string; last_name: string; admission_no: string; class_id: string }>
            >("/api/students");
            if (!result.ok) {
                throw new Error(result.error.message || "Failed to load students");
            }

            return result.data;
        });
    }, [runStudents]);

    useEffect(() => {
        void loadExams().catch(() => {
            // Error state is already managed by useSafeAsync.
        });
        void loadStudents().catch(() => {
            // Error state is already managed by useSafeAsync.
        });
    }, [loadExams, loadStudents]);

    const filteredRows = useMemo(() => {
        const rows = state.data || [];
        const q = searchQuery.trim().toLowerCase();
        return rows.filter((row) => {
            return (
                q.length === 0 ||
                row.student_name.toLowerCase().includes(q) ||
                row.exam_title.toLowerCase().includes(q) ||
                row.exam_subject.toLowerCase().includes(q) ||
                (row.admission_no || "").toLowerCase().includes(q) ||
                (row.class_name || "").toLowerCase().includes(q)
            );
        });
    }, [state.data, searchQuery]);

    const columns: DataTableColumn<ResultRow>[] = [
        {
            key: "student",
            label: "Student Performance",
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-black uppercase">
                        {(row.student_name || 'S').substring(0, 1)}
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 leading-none mb-1">{row.student_name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{row.admission_no}</p>
                    </div>
                </div>
            ),
        },
        {
            key: "exam",
            label: "Assessment",
            render: (row) => (
                <div>
                    <p className="text-[11px] font-bold text-slate-700 leading-none mb-1">{row.exam_title}</p>
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{row.exam_subject}</p>
                </div>
            ),
        },
        {
            key: "score",
            label: "Performance Index",
            render: (row) => {
                const percentage = (row.obtained_marks / row.max_marks) * 100;
                return (
                    <div className="flex flex-col w-32">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-black text-slate-700">{row.obtained_marks} / {row.max_marks}</span>
                            <span className={`text-[10px] font-black ${percentage >= 80 ? 'text-emerald-600' : percentage >= 50 ? 'text-blue-600' : 'text-red-500'}`}>{percentage.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-500 rounded-full ${percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-blue-500' : 'bg-red-500'}`}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </div>
                );
            }
        },
        {
            key: "grade",
            label: "Merit",
            render: (row) => (
                <Badge variant={row.grade === "A" || row.grade === "A+" ? "success" : row.grade === "F" ? "error" : "primary"} className="text-[10px] font-black uppercase px-2 py-0.5">
                    {row.grade}
                </Badge>
            ),
        }
    ];

    const rowActions: RowAction<ResultRow>[] = [
        { icon: "visibility", label: "Analytics", onClick: (row) => alert(`Analysis for ${row.student_name}`) },
        { icon: "download", label: "Report Card", onClick: (row) => alert(`Downloading for ${row.student_name}`) },
    ];

    const isDependencyLoading =
        examState.status === "idle" || examState.status === "loading" || studentState.status === "idle" || studentState.status === "loading";

    const examOptions = (examState.data ?? []).map((item) => ({
        id: item._id,
        class_id: item.class_id,
        label: `${item.title} - ${item.subject}`.trim()
    }));

    const studentOptions = (studentState.data ?? []).map((item) => ({
        id: item._id,
        class_id: item.class_id,
        label: `${item.admission_no} - ${item.first_name} ${item.last_name}`.trim()
    }));

    return (
        <div className="space-y-8 relative min-h-[80vh] pb-10">
            {/* Stats Section - Premium ERP Style */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Graded Units", value: (state.data || []).length, icon: "analytics", color: "text-blue-600", bg: "bg-blue-600/5" },
                    { label: "Avg. Performance", value: "78%", icon: "trending_up", color: "text-emerald-600", bg: "bg-emerald-600/5" },
                    { label: "Distinction Rate", value: "24%", icon: "stars", color: "text-amber-600", bg: "bg-amber-600/5" },
                    { label: "Pending Entry", value: "12", icon: "pending_actions", color: "text-purple-600", bg: "bg-purple-600/5" },
                ].map((stat, i) => (
                    <div key={i} className="premium-card bg-white p-3.5 border-slate-200/60 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all cursor-default">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <h3 className="text-xl font-black text-slate-900 tracking-tighter leading-none">{stat.value}</h3>
                        </div>
                        <div className={`h-8 w-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                            <span className="material-symbols-outlined text-lg font-black">{stat.icon}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Toolbar Section - Unified & Sticky */}
            <div className="premium-card p-2 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/80 backdrop-blur-md sticky top-[72px] z-20 border-slate-200/60 shadow-sm rounded-xl">
                <div className="flex flex-1 items-center gap-2 max-w-2xl">
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">search</span>
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search student, exam or admission no..."
                            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs font-medium text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-600/5 placeholder:text-slate-400"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-lg bg-slate-100 p-1 shadow-inner">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`flex h-7 items-center gap-2 rounded-md px-3 text-[11px] font-bold transition-all ${
                                viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            <span className="material-symbols-outlined text-base">grid_view</span>
                            Grid
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`flex h-7 items-center gap-2 rounded-md px-3 text-[11px] font-bold transition-all ${
                                viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            <span className="material-symbols-outlined text-base">view_list</span>
                            List
                        </button>
                    </div>
                    <div className="h-6 w-px bg-slate-200" />
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest px-2 whitespace-nowrap">
                        {filteredRows.length} <span className="text-slate-400">Records</span>
                    </span>
                    <div className="h-6 w-px bg-slate-200" />
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className={`inline-flex h-9 items-center gap-2 px-5 text-[11px] font-black uppercase tracking-widest transition-all rounded-xl shadow-lg active:scale-95 ${
                            isAdding ? "bg-slate-900 text-white" : "bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700"
                        }`}
                    >
                        <span className="material-symbols-outlined text-lg">{isAdding ? "close" : "add_box"}</span>
                        {isAdding ? "Cancel Entry" : "Record Result"}
                    </button>
                </div>
            </div>

            {/* Record Form - Collapsible Premium Style */}
            {isAdding && (
                <div className="premium-card p-6 bg-white border-blue-100 shadow-xl shadow-blue-900/5 animate-in slide-in-from-top-4 duration-300">
                    <div className="mb-6">
                        <h2 className="text-lg font-black text-slate-900">Record Assessment Results</h2>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Single Student entry mode</p>
                    </div>
                    {isDependencyLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full rounded-xl" />
                            <div className="grid grid-cols-2 gap-4">
                                <Skeleton className="h-10 w-full rounded-xl" />
                                <Skeleton className="h-10 w-full rounded-xl" />
                            </div>
                        </div>
                    ) : (
                        <ResultForm 
                            examOptions={examOptions} 
                            studentOptions={studentOptions} 
                            onCreate={(data) => {
                                addResult(data);
                                setIsAdding(false);
                            }} 
                        />
                    )}
                </div>
            )}

            {/* Main Content Area */}
            <div>
                {state.status === "loading" || state.status === "idle" ? (
                    <div className="space-y-8">
                        <TableSkeleton />
                    </div>
                ) : filteredRows.length === 0 ? (
                    <DataState variant="empty" title="No performance data found" message="Start recording student assessment results to see analytics." />
                ) : (
                    viewMode === "grid" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                            {filteredRows.map((row) => {
                                const percentage = (row.obtained_marks / row.max_marks) * 100;
                                return (
                                    <div key={row._id} className="premium-card group relative flex flex-col p-0 overflow-hidden transition-all duration-500 bg-white border-slate-200/60 hover:shadow-2xl hover:shadow-slate-200/80 hover:-translate-y-1">
                                        <div className="p-5">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black uppercase shadow-sm">
                                                    {(row.student_name || 'S').substring(0, 1)}
                                                </div>
                                                <Badge variant={row.grade === "A" || row.grade === "A+" ? "success" : row.grade === "F" ? "error" : "primary"} className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5">
                                                    Grade {row.grade}
                                                </Badge>
                                            </div>

                                            <div className="mb-6">
                                                <h3 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{row.student_name}</h3>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{row.admission_no} • {row.class_name}</p>
                                            </div>

                                            <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100/50 mb-6">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score Analysis</span>
                                                    <span className={`text-[11px] font-black ${percentage >= 80 ? 'text-emerald-600' : 'text-blue-600'}`}>{percentage.toFixed(1)}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full transition-all duration-700 rounded-full ${percentage >= 80 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-500 mt-2 text-center">
                                                    Obtained <span className="text-slate-900">{row.obtained_marks}</span> out of <span className="text-slate-900">{row.max_marks}</span>
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                                                <span className="material-symbols-outlined text-blue-600 text-sm">description</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-black text-slate-900 truncate uppercase tracking-widest">{row.exam_title}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{row.exam_subject}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-auto px-5 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between group-hover:bg-white transition-all">
                                            <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 flex items-center gap-1 transition-colors">
                                                <span className="material-symbols-outlined text-sm">history_edu</span>
                                                Transcript
                                            </button>
                                            <button className="group/btn h-8 px-4 rounded-lg bg-blue-600 text-[10px] font-black text-white uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm active:scale-95">
                                                Analytics
                                                <span className="material-symbols-outlined text-sm transition-transform group-hover/btn:translate-x-1">query_stats</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="premium-card overflow-hidden border-slate-200/60 shadow-sm bg-white rounded-2xl">
                            <DataTable
                                columns={columns}
                                rows={filteredRows}
                                rowKey={(row) => row._id}
                                sortable
                                paginated={10}
                                rowActions={rowActions}
                            />
                        </div>
                    )
                )}
            </div>

            {/* Pagination Footer - Premium ERP Style */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Showing <span className="text-blue-600">1</span> to <span className="text-slate-900">{filteredRows.length}</span> of <span className="text-slate-900">{filteredRows.length}</span> Academic Records
                </p>
                <div className="flex items-center gap-2">
                    <button className="h-9 px-4 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-not-allowed flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">chevron_left</span>
                        Previous
                    </button>
                    <div className="flex items-center gap-1">
                        <button className="h-9 w-9 rounded-xl bg-blue-600 text-[10px] font-black text-white shadow-lg shadow-blue-600/20">1</button>
                    </div>
                    <button className="h-9 px-4 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-not-allowed flex items-center gap-2">
                        Next
                        <span className="material-symbols-outlined text-base">chevron_right</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
