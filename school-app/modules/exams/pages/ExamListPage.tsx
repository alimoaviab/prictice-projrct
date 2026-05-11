"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { DataTable, DataTableColumn, RowAction, Badge, DataState, Skeleton, TableSkeleton } from "../../../components/ui";
import { useExams } from "../hooks/useExams";
import { ExamRow } from "../types/exam.types";
import { showToast } from "../../../utils/toast";

export function ExamListPage({ filters }: { filters?: { class_id?: string; subject?: string } }) {
  const pathname = usePathname();
  const { state, updateExam, deleteExam } = useExams(filters);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "scheduled" | "completed" | "cancelled">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredRows = useMemo(() => {
    const rows = state.data || [];
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      const queryMatch =
        q.length === 0 ||
        row.title.toLowerCase().includes(q) ||
        row.subject.toLowerCase().includes(q) ||
        (row.class_name || "").toLowerCase().includes(q);
      const statusMatch = statusFilter === "all" ? true : row.status === statusFilter;
      return queryMatch && statusMatch;
    });
  }, [state.data, searchQuery, statusFilter]);

  const columns: DataTableColumn<ExamRow>[] = [
    {
      key: "title",
      label: "Exam Identity",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
            {row.title.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-none mb-1">{row.title}</p>
            <p className="text-[10px] text-slate-400 font-bold normal-case tracking-tighter">{row.subject}</p>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "class",
      label: "Class",
      render: (row) => <Badge variant="secondary" className="bg-slate-50 text-slate-600 border-slate-100">{row.class_name || "Unassigned"}</Badge>,
    },
    {
      key: "date",
      label: "Date",
      render: (row) => (
        <div className="flex items-center gap-2">
           <span className="material-symbols-outlined text-slate-400 text-sm">calendar_today</span>
           <span className="text-[11px] font-bold text-slate-600">{row.starts_at}</span>
        </div>
      ),
    },
    {
      key: "marks",
      label: "Max Marks",
      render: (row) => <span className="text-[11px] font-bold text-slate-700">{row.max_marks} Pts</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge variant={row.status === "completed" ? "success" : row.status === "scheduled" ? "primary" : "gray"} className="text-[9px] font-bold normal-case  px-2 py-0.5">
          {row.status}
        </Badge>
      ),
    },
  ];

  const rowActions: RowAction<ExamRow>[] = [
    {
      icon: "visibility",
      label: "View",
      onClick: (row) => alert(`Exam: ${row.title}`),
    },
    {
      icon: "settings",
      label: "Configure",
      onClick: (row) => alert(`Edit: ${row.title}`),
    },
    {
      icon: "delete",
      label: "Remove",
      variant: "danger",
      onClick: (row) => deleteExam(row._id),
    },
  ];

  if (state.status === "loading" || state.status === "idle") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <TableSkeleton />
      </div>
    );
  }

  if (state.status === "error") {
    return <DataState variant="error" title="Failed to load exams" message={state.error} />;
  }

  return (
    <div className="space-y-8 relative min-h-[80vh] pb-10">
      {/* Stats Section - Premium & Compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Exams", value: state.data?.length || 0, icon: "analytics", color: "text-blue-600", bg: "bg-blue-600/5" },
          { label: "Scheduled", value: state.data?.filter(e => e.status === "scheduled").length || 0, icon: "event", color: "text-amber-600", bg: "bg-amber-600/5" },
          { label: "Completed", value: state.data?.filter(e => e.status === "completed").length || 0, icon: "task_alt", color: "text-emerald-600", bg: "bg-emerald-600/5" },
          { label: "Avg. Marks", value: "85%", icon: "monitoring", color: "text-purple-600", bg: "bg-purple-600/5" },
        ].map((stat, i) => (
          <div key={i} className="premium-card bg-white p-3.5 border-slate-200/60 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all cursor-default">
            <div>
              <p className="text-[10px] font-bold text-slate-400 normal-case  mb-1">{stat.label}</p>
              <h3 className="text-xl font-bold text-slate-900 tracking-tighter leading-none">{stat.value}</h3>
            </div>
            <div className={`h-8 w-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
               <span className="material-symbols-outlined text-lg font-bold">{stat.icon}</span>
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
              placeholder="Search exam title, subject or class..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs font-medium text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-600/5 placeholder:text-slate-400"
            />
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none cursor-pointer transition-all hover:border-slate-300 focus:border-blue-400"
          >
            <option value="all">Lifecycle: All</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
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
          <span className="text-[10px] font-bold text-slate-900 normal-case  px-2 whitespace-nowrap">
            {filteredRows.length} <span className="text-slate-400">EXAMS</span>
          </span>
          <div className="h-6 w-px bg-slate-200" />
          <Link
            href={pathname.includes("/teacher") ? "/teacher/exams/create" : "/admin/exams/create"}
            className="inline-flex h-9 items-center gap-2 px-5 text-[11px] font-bold normal-case  text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">add_task</span>
            Create Examination
          </Link>
        </div>
      </div>

      {/* Content Area */}
      <div>
        {filteredRows.length === 0 ? (
          <DataState 
            variant="empty" 
            title="No Exams Found" 
            message={searchQuery ? "Try refining your search parameters." : "Start by scheduling your first student assessment cycle."} 
          />
        ) : (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {filteredRows.map((exam) => (
                <div key={exam._id} className="premium-card group relative flex flex-col p-0 overflow-hidden transition-all duration-500 bg-white border-slate-200/60 hover:shadow-2xl hover:shadow-slate-200/80 hover:-translate-y-1">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm transition-transform group-hover:scale-110">
                        <span className="material-symbols-outlined text-[20px] font-bold">description</span>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-50/50 rounded-lg p-1 border border-slate-100">
                        <button className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all">
                          <span className="material-symbols-outlined text-base">settings</span>
                        </button>
                        <button 
                          onClick={() => deleteExam(exam._id)}
                          className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:bg-white hover:text-red-500 hover:shadow-sm transition-all"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-base font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{exam.title}</h3>
                        <Badge variant={exam.status === "completed" ? "success" : exam.status === "scheduled" ? "primary" : "gray"} className="text-[7px] font-bold normal-case  px-1 py-0">
                          {exam.status}
                        </Badge>
                      </div>
                      <p className="text-[9px] font-bold text-blue-600 normal-case ">{exam.subject}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-slate-50/50 rounded-lg p-2 border border-slate-100/50">
                        <p className="text-[7px] font-bold text-slate-400 normal-case  mb-0.5">Target Class</p>
                        <p className="text-[9px] font-bold text-slate-700 truncate">{exam.class_name || "Unassigned"}</p>
                      </div>
                      <div className="bg-slate-50/50 rounded-lg p-2 border border-slate-100/50">
                        <p className="text-[7px] font-bold text-slate-400 normal-case  mb-0.5">Max Marks</p>
                        <p className="text-[9px] font-bold text-slate-700">{exam.max_marks} Pts</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-sm">calendar_month</span>
                        <span className="text-[10px] font-bold text-slate-400 normal-case ">{exam.starts_at}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-auto px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between group-hover:bg-white transition-all">
                     <button className="text-[9px] font-bold text-slate-400 normal-case  hover:text-blue-600 flex items-center gap-1 transition-colors">
                        <span className="material-symbols-outlined text-xs">visibility</span>
                        Details
                     </button>
                     <Link 
                       href={`${pathname.includes("/teacher") ? "/teacher" : "/admin"}/results?exam_id=${exam._id}`}
                       className="group/btn h-7 px-3 rounded-lg bg-blue-600 text-[9px] font-bold text-white normal-case  hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm active:scale-95"
                     >
                        Results
                        <span className="material-symbols-outlined text-xs transition-transform group-hover/btn:translate-x-1">arrow_forward</span>
                     </Link>
                  </div>
                </div>
              ))}
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
        <p className="text-[10px] font-bold text-slate-400 normal-case ">
          Showing <span className="text-blue-600">1</span> to <span className="text-slate-900">{filteredRows.length}</span> of <span className="text-slate-900">{filteredRows.length}</span> Examination Cycles
        </p>
        <div className="flex items-center gap-2">
          <button className="h-9 px-4 rounded-xl border border-slate-200 text-[10px] font-bold normal-case  text-slate-400 cursor-not-allowed flex items-center gap-2">
            <span className="material-symbols-outlined text-base">chevron_left</span>
            Previous
          </button>
          <div className="flex items-center gap-1">
            <button className="h-9 w-9 rounded-xl bg-blue-600 text-[10px] font-bold text-white shadow-lg shadow-blue-600/20">1</button>
          </div>
          <button className="h-9 px-4 rounded-xl border border-slate-200 text-[10px] font-bold normal-case  text-slate-400 cursor-not-allowed flex items-center gap-2">
            Next
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
