import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { DataTable, DataTableColumn, RowAction, Badge, DataState, Skeleton, TableSkeleton, StatCardGrid } from "@/components/ui";
import { useExams } from "../hooks/useExams";
import { ExamRow } from "../types/exam.types";
import { useQueryParams } from "@/hooks/useQueryParams";

export function ExamListPage({ filters }: { filters?: { class_id?: string; subject?: string } }) {
  const pathname = useLocation().pathname;
  const isParent = pathname.includes("/parent");
  const isTeacher = pathname.includes("/teacher");
  const marksBase = isTeacher ? "/teacher/exams/marks" : "/admin/exams/marks";
  const examsCreatePath = isTeacher ? "/teacher/exams/create" : "/admin/exams/create";
  const { currentParams, updateQuery, withQuery } = useQueryParams();
  
  const today = new Date().toISOString().split('T')[0];
  
  const [searchQuery, setSearchQuery] = useState(currentParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState<"all" | "scheduled" | "completed" | "cancelled">((currentParams.get("status") as any) || "all");
  const [viewMode, setViewMode] = useState<"grid" | "list">((currentParams.get("view") as any) || "grid");

  const { state } = useExams(filters);

  useEffect(() => {
    setSearchQuery(currentParams.get("search") || "");
    setStatusFilter((currentParams.get("status") as any) || "all");
    setViewMode((currentParams.get("view") as any) || "grid");
  }, [currentParams.toString()]);

  const filteredRows = useMemo(() => {
    const rows = state.data || [];
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      const queryMatch =
        q.length === 0 ||
        row.title.toLowerCase().includes(q) ||
        row.subject.toLowerCase().includes(q);
      const statusMatch = statusFilter === "all" ? true : row.status === statusFilter;
      
      return queryMatch && statusMatch;
    });
  }, [state.data, searchQuery, statusFilter]);

  const columns: DataTableColumn<ExamRow>[] = [
    {
      key: "title",
      label: "Examination",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-[12px] font-black text-slate-900 leading-none mb-1 tracking-tight">{row.title}</span>
          <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{row.subject}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "date",
      label: "Schedule",
      render: (row) => (
        <div className="flex items-center gap-2">
           <span className="material-symbols-outlined text-slate-300 text-[16px]">calendar_today</span>
           <span className="text-[11px] font-bold text-slate-600">{row.starts_at}</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Current Status",
      render: (row) => (
        <Badge variant={row.status === "completed" ? "success" : row.status === "scheduled" ? "primary" : "gray"} className="text-[9px] font-bold normal-case px-2 py-0.5">
          {row.status}
        </Badge>
      ),
    },
  ];

  const rowActions: RowAction<ExamRow>[] = isParent
    ? []
    : [
        {
          icon: "edit_note",
          label: "Enter Marks",
          variant: "primary",
          onClick: (row) => {
            window.location.assign(`${marksBase}?exam_id=${encodeURIComponent(row._id)}`);
          },
        },
      ];

  if (state.status === "loading" || state.status === "idle") {
    return <TableSkeleton />;
  }

  if (state.status === "error") {
    return <DataState variant="error" title="Synchronization Error" message={state.error} />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <StatCardGrid
        items={[
          { label: "Total Exams", value: state.data?.length || 0, icon: "quiz", accent: "blue" },
          { label: "Upcoming", value: state.data?.filter(e => e.status === "scheduled").length || 0, icon: "event", accent: "purple" },
          { label: "Completed", value: state.data?.filter(e => e.status === "completed").length || 0, icon: "task_alt", accent: "emerald" },
          { label: "Results Pending", value: state.data?.filter(e => e.status === "scheduled" && (e.results_count || 0) === 0).length || 0, icon: "pending", accent: "amber" },
        ]}
      />

      {/* Toolbar */}
      <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
           <div className="relative flex-1 max-w-xs">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-lg text-slate-400">search</span>
              <input
                value={searchQuery}
                onChange={(e) => {
                  const v = e.target.value;
                  setSearchQuery(v);
                  updateQuery({ search: v });
                }}
                placeholder="Filter exams by title or subject..."
                className="h-9 w-full rounded-lg border border-slate-50 bg-slate-50/50 pl-9 pr-3 text-[11px] font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-400"
              />
           </div>

           <select
             value={statusFilter}
             onChange={(e) => {
               const v = e.target.value as any;
               setStatusFilter(v);
               updateQuery({ status: v });
             }}
             className="h-9 rounded-lg border border-slate-50 bg-slate-50/50 px-3 text-[10px] font-black uppercase text-slate-600 outline-none cursor-pointer hover:bg-slate-50 transition-colors"
           >
             <option value="all">All Status</option>
             <option value="scheduled">Scheduled</option>
             <option value="completed">Completed</option>
             <option value="cancelled">Cancelled</option>
           </select>

           {(searchQuery || statusFilter !== "all") && (
             <button
               type="button"
               onClick={() => {
                 setSearchQuery("");
                 setStatusFilter("all");
                 updateQuery({ search: "", status: "all" });
               }}
               className="h-9 inline-flex items-center gap-1.5 px-3 rounded-lg border border-slate-200 bg-white text-[10px] font-bold text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors"
               title="Clear filters"
             >
               <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
               Reset
             </button>
           )}
        </div>

        <div className="flex items-center gap-2">
           <div className="h-9 flex items-center bg-slate-100 p-1 rounded-lg">
             <button onClick={() => { setViewMode("grid"); updateQuery({ view: "grid" }); }} className={`h-7 px-3 rounded-md text-[10px] font-black uppercase tracking-tight transition-all ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"}`}>Grid</button>
             <button onClick={() => { setViewMode("list"); updateQuery({ view: "list" }); }} className={`h-7 px-3 rounded-md text-[10px] font-black uppercase tracking-tight transition-all ${viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"}`}>List</button>
           </div>

           {!isParent && (
             <Link
               to={withQuery(examsCreatePath)}
               className="h-9 inline-flex items-center gap-2 px-4 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm active:scale-95 transition-all"
             >
               <span className="material-symbols-outlined text-[16px]">add</span>
               New Exam
             </Link>
           )}
        </div>
      </div>

      {/* Grid / List Content */}
      {filteredRows.length === 0 ? (
        <DataState variant="empty" title="No Exams Found" message="No upcoming or past exams found for the selected criteria." />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRows.map((exam) => (
            <div key={exam._id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:border-blue-200 transition-all flex flex-col">
               <div className="flex items-center justify-between mb-4">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                     <span className="material-symbols-outlined text-[18px]">description</span>
                  </div>
                  <Badge variant={exam.status === "completed" ? "success" : "primary"} className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5">
                    {exam.status}
                  </Badge>
               </div>
               <h3 className="text-[13px] font-black text-slate-900 mb-0.5 truncate">{exam.title}</h3>
               <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-4">{exam.subject}</p>

               <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                     <span className="material-symbols-outlined text-slate-300 text-[14px]">calendar_today</span>
                     <span className="text-[10px] font-bold text-slate-400">{exam.starts_at}</span>
                  </div>
                  <div className="text-[10px] font-black text-slate-900">{exam.max_marks} Pts</div>
               </div>

               {!isParent && (
                 <Link
                   to={`${marksBase}?exam_id=${encodeURIComponent(exam._id)}`}
                   className="mt-3 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all"
                 >
                   <span className="material-symbols-outlined text-[14px]">edit_note</span>
                   Enter Marks
                 </Link>
               )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
           <DataTable columns={columns} rows={filteredRows} rowKey={(row) => row._id} rowActions={rowActions} />
        </div>
      )}
    </div>
  );
}
