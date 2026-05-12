"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DataTable, DataTableColumn, RowAction, Badge, DataState, Skeleton, TableSkeleton } from "../../../components/ui";
import { useResults } from "../hooks/useResults";
import { ResultRow } from "../types/result.types";
import { showToast } from "../../../utils/toast";
import { useQueryParams } from "../../../hooks/useQueryParams";
import { useClasses } from "../../classes/hooks/useClasses";
import { useExams } from "../../exams/hooks/useExams";

export function ResultListPage({ filters }: { filters?: { exam_id?: string; student_id?: string } }) {
  const pathname = usePathname();
  const { currentParams, updateQuery, withQuery } = useQueryParams();
  const { state: classState } = useClasses();
  
  const [searchQuery, setSearchQuery] = useState(currentParams.get("search") || "");
  const [gradeFilter, setGradeFilter] = useState<string>(currentParams.get("grade") || "all");
  const [classFilter, setClassFilter] = useState<string>(currentParams.get("class_id") || "all");
  const [examFilter, setExamFilter] = useState<string>(currentParams.get("exam_id") || "all");
  const today = new Date().toISOString().split('T')[0];
  const [dateFilter, setDateFilter] = useState<string>(currentParams.get("date") || today);

  const { state: examState } = useExams(classFilter !== "all" ? { class_id: classFilter } : {});
  const { state, updateResult, deleteResult } = useResults({
    exam_id: examFilter !== "all" ? examFilter : undefined,
    ...(filters || {})
  });

  useEffect(() => {
    setSearchQuery(currentParams.get("search") || "");
    setGradeFilter(currentParams.get("grade") || "all");
    setClassFilter(currentParams.get("class_id") || "all");
    setExamFilter(currentParams.get("exam_id") || "all");
    setDateFilter(currentParams.get("date") || "");
  }, [currentParams.toString()]);

  const filteredRows = useMemo(() => {
    const rows = state.data || [];
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      const queryMatch =
        q.length === 0 ||
        row.exam_title.toLowerCase().includes(q) ||
        row.student_name.toLowerCase().includes(q) ||
        row.admission_no.toLowerCase().includes(q);
      
      const gradeMatch = gradeFilter === "all" ? true : row.grade === gradeFilter;
      const classMatch = classFilter === "all" ? true : row.class_id === classFilter;
      const dateMatch = dateFilter === "" ? true : row.graded_at?.split('T')[0] === dateFilter;

      return queryMatch && gradeMatch && classMatch && dateMatch;
    });
  }, [state.data, searchQuery, gradeFilter, classFilter, dateFilter]);

  const stats = useMemo(() => {
    const data = state.data || [];
    const passCount = data.filter(r => r.grade !== 'F').length;
    
    let avg = 0;
    if (data.length > 0) {
      const sum = data.reduce((acc, r) => acc + (r.obtained_marks / (r.max_marks || 100)), 0);
      avg = Math.round((sum / data.length) * 100);
    }

    return {
      total: data.length,
      passRate: data.length > 0 ? `${Math.round((passCount / data.length) * 100)}%` : "0%",
      avgMarks: `${avg}%`,
      topGrades: data.filter(r => r.grade === 'A' || r.grade === 'A+').length,
    };
  }, [state.data]);

  const columns: DataTableColumn<ResultRow>[] = useMemo(() => [
    {
      key: "exam",
      label: "Academic Milestone",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 leading-none mb-1">{row.exam_title}</span>
          <span className="text-[10px] text-slate-400 font-bold normal-case tracking-tighter">{row.exam_subject}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "student",
      label: "Learner identity",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-slate-700 leading-none mb-1">{row.student_name}</span>
          <span className="text-[9px] font-bold text-slate-400 normal-case ">{row.admission_no} &bull; {row.class_name}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "marks",
      label: "Performance Index",
      render: (row) => {
        const ratio = row.obtained_marks / row.max_marks;
        return (
          <div className="flex flex-col w-32">
            <div className="flex items-center justify-between mb-1">
               <span className="text-[11px] font-bold text-slate-900">{row.obtained_marks} / {row.max_marks}</span>
               <span className="text-[9px] font-bold text-slate-400 normal-case ">{Math.round(ratio * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${ratio >= 0.6 ? "bg-emerald-500 shadow-sm" : ratio >= 0.4 ? "bg-amber-500 shadow-sm" : "bg-rose-500 shadow-sm"}`}
                style={{ width: `${ratio * 100}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: "grade",
      label: "Evaluation",
      render: (row) => (
        <Badge 
          variant={row.grade === "A" || row.grade === "A+" ? "success" : row.grade === "F" ? "error" : "primary"}
          className="text-[10px] font-bold normal-case  px-2.5 py-1 min-w-[32px] text-center"
        >
          {row.grade}
        </Badge>
      ),
    },
    {
        key: "period",
        label: "Timeline",
        render: (row) => <span className="text-[10px] font-bold text-slate-500 normal-case ">{new Date(row.graded_at).toLocaleDateString()}</span>,
    }
  ], []);

  const rowActions: RowAction<ResultRow>[] = useMemo(() => [
    {
      icon: "visibility",
      label: "Transcript",
      variant: "primary",
      onClick: (row) => alert(`Exam: ${row.exam_title}`),
    },
    {
      icon: "edit",
      label: "Re-Grade",
      variant: "ghost",
      onClick: async (row) => {
        const marksInput = window.prompt("Obtained marks", String(row.obtained_marks));
        if (marksInput) await updateResult(row._id, { obtained_marks: Number(marksInput) });
      },
    },
    {
      icon: "delete",
      label: "Void Record",
      variant: "danger",
      requireConfirm: true,
      onClick: (row) => deleteResult(row._id),
    },
  ], []);

  if (state.status === "loading" && !state.data) {
    return <TableSkeleton />;
  }

  if (state.status === "error") {
    return <DataState variant="error" title="Academic Data Error" message={state.error} />;
  }

  return (
    <div className="space-y-8 relative min-h-[80vh] pb-10">
      {/* Stats Section - Premium & Academic */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Graded Records", value: stats.total, icon: "grading", color: "text-blue-600", bg: "bg-blue-600/5" },
          { label: "Institutional Pass", value: stats.passRate, icon: "verified", color: "text-emerald-600", bg: "bg-emerald-600/5" },
          { label: "Average Score", value: stats.avgMarks, icon: "leaderboard", color: "text-amber-600", bg: "bg-amber-600/5" },
          { label: "Excellence Hub", value: stats.topGrades, icon: "workspace_premium", color: "text-purple-600", bg: "bg-purple-600/5" },
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
              onChange={(e) => {
                const value = e.target.value;
                setSearchQuery(value);
                updateQuery({ search: value });
              }}
              placeholder="Search student, exam or admission ID..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs font-medium text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-600/5 placeholder:text-slate-400"
            />
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <select
            value={gradeFilter}
            onChange={(e) => {
              const value = e.target.value;
              setGradeFilter(value);
              updateQuery({ grade: value });
            }}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-bold text-slate-600 outline-none cursor-pointer transition-all hover:border-slate-300 focus:border-blue-400"
          >
            <option value="all">Evaluation: All</option>
            <option value="A+">Distinction (A+)</option>
            <option value="A">Excellence (A)</option>
            <option value="B">Commendable (B)</option>
            <option value="F">Critical Re-eval (F)</option>
          </select>

          <select
            value={classFilter}
            onChange={(e) => {
              const value = e.target.value;
              setClassFilter(value);
              setExamFilter("all"); // Reset exam when class changes
              updateQuery({ class_id: value, exam_id: "all" });
            }}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-bold text-slate-600 outline-none cursor-pointer transition-all hover:border-slate-300 focus:border-blue-400"
          >
            <option value="all">All Classes</option>
            {((classState.data as any)?.data || []).map((c: any) => (
              <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
            ))}
          </select>

          <select
            value={examFilter}
            onChange={(e) => {
              const value = e.target.value;
              setExamFilter(value);
              updateQuery({ exam_id: value });
            }}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-bold text-slate-600 outline-none cursor-pointer transition-all hover:border-slate-300 focus:border-blue-400"
            disabled={classFilter === "all"}
          >
            <option value="all">Select Exam</option>
            {(examState.data || []).map((e: any) => (
              <option key={e._id} value={e._id}>{e.title}</option>
            ))}
          </select>

          <input 
            type="date"
            value={dateFilter}
            onChange={(e) => {
              const value = e.target.value;
              setDateFilter(value);
              updateQuery({ date: value });
            }}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-bold text-slate-600 outline-none cursor-pointer transition-all hover:border-slate-300 focus:border-blue-400"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-900 normal-case  px-2 whitespace-nowrap">
            {filteredRows.length} <span className="text-slate-400">RECORDS</span>
          </span>
          <div className="h-6 w-px bg-slate-200" />
          {!pathname.includes("/parent") && (
            <Link
              href={withQuery(pathname.includes("/teacher") ? "/teacher/results/create" : "/admin/results/create")}
              className="inline-flex h-9 items-center gap-2 px-5 text-[11px] font-bold normal-case  text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">add_chart</span>
              Record Performance
            </Link>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="premium-card overflow-hidden border-slate-200/60 shadow-sm bg-white rounded-2xl">
        <DataTable
          columns={columns}
          rows={filteredRows}
          rowKey={(row) => row._id}
          sortable
          paginated={10}
          rowActions={pathname.includes("/parent") ? rowActions.filter(a => a.label === "Transcript") : rowActions}
          emptyState={{
            title: "No Evaluation Records Found",
            description: searchQuery ? "Try refining your filters." : "Start by recording the first student performance for this cycle.",
          }}
        />
      </div>

      {/* Pagination Footer - Premium ERP Style */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 normal-case ">
          Showing <span className="text-blue-600">1</span> to <span className="text-slate-900">{filteredRows.length}</span> of <span className="text-slate-900">{state.data?.length}</span> Assessments
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
