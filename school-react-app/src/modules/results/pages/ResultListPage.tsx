import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { DataTable, DataTableColumn, RowAction, Badge, DataState, Skeleton, TableSkeleton, StatCardGrid } from "@/components/ui";
import { useResults } from "../hooks/useResults";
import { ResultRow } from "../types/result.types";
import { showToast } from "@/utils/toast";
import { useQueryParams } from "@/hooks/useQueryParams";
import { useClasses } from "../../classes/hooks/useClasses";
import { useExams } from "../../exams/hooks/useExams";
import { exportMarksheet, exportExamMarksheet } from "@/utils/marksheet";
import { useAuth } from "@/hooks/useAuth";

export function ResultListPage({ filters }: { filters?: { exam_id?: string; student_id?: string } }) {
  const pathname = useLocation().pathname;
  const isParent = pathname.includes("/parent");
  const { currentParams, updateQuery, withQuery } = useQueryParams();
  const { state: classState } = useClasses();
  
  const [searchQuery, setSearchQuery] = useState(currentParams.get("search") || "");
  const [gradeFilter, setGradeFilter] = useState<string>(currentParams.get("grade") || "all");
  const [classFilter, setClassFilter] = useState<string>(currentParams.get("class_id") || "all");
  const [examFilter, setExamFilter] = useState<string>(currentParams.get("exam_id") || "all");

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

      return queryMatch && gradeMatch && classMatch;
    });
  }, [state.data, searchQuery, gradeFilter, classFilter]);

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
    };
  }, [state.data]);

  const columns: DataTableColumn<ResultRow>[] = useMemo(() => [
    {
      key: "exam",
      label: "Assessment Title",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-[12px] font-black text-slate-900 leading-none mb-1 tracking-tight">{row.exam_title}</span>
          <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{row.exam_subject}</span>
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
               <span className="text-[11px] font-black text-slate-900">{row.obtained_marks} <span className="text-slate-400 font-medium">/ {row.max_marks}</span></span>
               <span className="text-[10px] font-black text-blue-600">{Math.round(ratio * 100)}%</span>
            </div>
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${ratio >= 0.4 ? "bg-blue-600" : "bg-rose-500"}`}
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
        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
          row.grade === 'F' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-blue-50 text-blue-600 border-blue-100'
        }`}>
          Grade {row.grade}
        </span>
      ),
    },
    {
        key: "period",
        label: "Graded On",
        render: (row) => <span className="text-[10px] font-bold text-slate-400">{new Date(row.graded_at).toLocaleDateString()}</span>,
    }
  ], []);

  const { user } = useAuth();
  const schoolName = (user as any)?.schoolName || (user as any)?.school_name || "School";

  const rowActions: RowAction<ResultRow>[] = useMemo(() => [
    {
      icon: "download",
      label: "Marksheet",
      variant: "primary",
      onClick: (row) => {
        exportMarksheet(row, { schoolName });
        showToast("Generating marksheet…", "info");
      },
    },
  ], [schoolName]);

  if (state.status === "loading" && !state.data) {
    return <TableSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Metrics Strip */}
      <StatCardGrid
        items={[
          { label: "Evaluations", value: stats.total, icon: "grading", accent: "blue" },
          { label: "Success Rate", value: stats.passRate, icon: "verified", accent: "emerald" },
          { label: "Avg. Performance", value: stats.avgMarks, icon: "leaderboard", accent: "purple" },
          {
            label: "Top Grade",
            value:
              (state.data || []).reduce<string>(
                (best, r) => (best === "F" || (r.grade && r.grade < best) ? r.grade : best),
                "F"
              ),
            icon: "workspace_premium",
            accent: "amber",
          },
        ]}
      />

      {/* Toolbar */}
      {!isParent && (
        <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-lg text-slate-400">search</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by student or exam..."
              className="h-9 w-full rounded-lg border border-slate-50 bg-slate-50/50 pl-9 pr-3 text-[11px] font-bold text-slate-700 outline-none transition-all focus:bg-white focus:border-blue-400"
            />
          </div>
          
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-100 bg-white px-3 text-[10px] font-black uppercase text-slate-600 outline-none cursor-pointer"
          >
            <option value="all">All Classes</option>
            {((classState.data as any)?.data || []).map((c: any) => (
              <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
            ))}
          </select>

          <Link
            to={withQuery(pathname.includes("/teacher") ? "/teacher/results/create" : "/admin/results/create")}
            className="h-9 flex items-center gap-2 px-4 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">add_chart</span>
            Record Results
          </Link>

          {filteredRows.length > 0 && (
            <button
              type="button"
              onClick={() => {
                exportExamMarksheet(filteredRows, { schoolName });
                showToast("Generating class marksheet…", "info");
              }}
              className="h-9 flex items-center gap-2 px-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider hover:border-blue-300 hover:text-blue-700 transition-all"
              title="Download a marksheet covering every visible row"
            >
              <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
              Export Sheet
            </button>
          )}
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          rows={filteredRows}
          rowKey={(row) => row._id}
          sortable
          paginated={10}
          rowActions={rowActions}
          emptyState={{
            title: "No Records Found",
            description: "No assessment data has been recorded for the selected criteria.",
          }}
        />
      </div>
    </div>
  );
}
