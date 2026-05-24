import { AppIcon } from "shared/ui/AppIcon";
/**
 * Results list page.
 *
 * Architecture: ONE result row per (exam, student) — the row carries a
 * `subjects[]` breakdown so we can render every subject's mark in the
 * same visual unit instead of duplicating the row N times.
 *
 * The UI shows the aggregate obtained / max + percentage on the main
 * line and the per-subject breakdown as compact chips underneath. This
 * makes it instantly clear that a multi-subject "Mid-Term" is one
 * result, not four.
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  DataTable,
  DataTableColumn,
  RowAction,
  Badge,
  DataState,
  TableSkeleton,
  StatCardGrid,
} from "@/components/ui";
import { useResults } from "../hooks/useResults";
import { ResultRow } from "../types/result.types";
import { showToast } from "@/utils/toast";
import { useQueryParams } from "@/hooks/useQueryParams";
import { useClasses } from "../../classes/hooks/useClasses";
import { useExams } from "../../exams/hooks/useExams";
import { exportMarksheet, exportExamMarksheet } from "@/utils/marksheet";
import { useAuth } from "@/hooks/useAuth";

export function ResultListPage({
  filters,
}: {
  filters?: { exam_id?: string; student_id?: string };
}) {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const isParent = pathname.includes("/parent");
  const { currentParams, updateQuery, withQuery } = useQueryParams();
  const { state: classState } = useClasses();

  const [searchQuery, setSearchQuery] = useState(currentParams.get("search") || "");
  const [gradeFilter, setGradeFilter] = useState<string>(currentParams.get("grade") || "all");
  const [classFilter, setClassFilter] = useState<string>(
    currentParams.get("class_id") || "all"
  );
  const [examFilter, setExamFilter] = useState<string>(
    currentParams.get("exam_id") || "all"
  );

  const { state: examState } = useExams(
    classFilter !== "all" ? { class_id: classFilter } : {}
  );
  const { state } = useResults({
    exam_id: examFilter !== "all" ? examFilter : undefined,
    ...(filters || {}),
  });

  useEffect(() => {
    setSearchQuery(currentParams.get("search") || "");
    setGradeFilter(currentParams.get("grade") || "all");
    setClassFilter(currentParams.get("class_id") || "all");
    setExamFilter(currentParams.get("exam_id") || "all");
  }, [currentParams.toString()]);

  // De-dupe defensively in case the API returns more than one row for
  // the same (exam_id, student_id) pair (legacy data with per-subject
  // exams). We keep the most recently graded row.
  const dedupedRows = useMemo(() => {
    const rows = Array.isArray(state.data) ? state.data : [];
    const map = new Map<string, ResultRow>();
    for (const row of rows) {
      const key = `${row.exam_id}::${row.student_id}`;
      const existing = map.get(key);
      if (
        !existing ||
        new Date(row.graded_at).getTime() > new Date(existing.graded_at).getTime()
      ) {
        map.set(key, row);
      }
    }
    return Array.from(map.values());
  }, [state.data]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dedupedRows.filter((row) => {
      const subjectsConcat = (row.subjects || [])
        .map((s) => s.subject_name)
        .join(" ")
        .toLowerCase();
      const queryMatch =
        q.length === 0 ||
        row.exam_title.toLowerCase().includes(q) ||
        row.student_name.toLowerCase().includes(q) ||
        row.admission_no.toLowerCase().includes(q) ||
        (row.exam_subject || "").toLowerCase().includes(q) ||
        subjectsConcat.includes(q);
      const gradeMatch = gradeFilter === "all" ? true : row.grade === gradeFilter;
      const classMatch = classFilter === "all" ? true : row.class_id === classFilter;
      return queryMatch && gradeMatch && classMatch;
    });
  }, [dedupedRows, searchQuery, gradeFilter, classFilter]);

  const stats = useMemo(() => {
    const passCount = filteredRows.filter((r) => r.grade !== "F").length;
    let avg = 0;
    if (filteredRows.length > 0) {
      const sum = filteredRows.reduce((acc, r) => {
        const max = r.max_marks || 100;
        return acc + r.obtained_marks / max;
      }, 0);
      avg = Math.round((sum / filteredRows.length) * 100);
    }
    return {
      total: filteredRows.length,
      passRate:
        filteredRows.length > 0
          ? `${Math.round((passCount / filteredRows.length) * 100)}%`
          : "0%",
      avgMarks: `${avg}%`,
    };
  }, [filteredRows]);

  const columns: DataTableColumn<ResultRow>[] = useMemo(
    () => [
      {
        key: "student",
        label: "Student",
        render: (row) => (
          <div className="flex flex-col">
            <span className="text-[12px] font-bold text-slate-900 leading-tight">
              {row.student_name}
            </span>
            <span className="text-[10px] font-bold text-slate-400 mt-0.5">
              {row.admission_no}
            </span>
          </div>
        ),
        sortable: true,
        sortFn: (a, b) => a.student_name.localeCompare(b.student_name),
      },
      {
        key: "exam",
        label: "Exam",
        render: (row) => {
          const count = row.subjects && row.subjects.length > 0
            ? row.subjects.length
            : (row.exam_subject ? row.exam_subject.split(",").filter(s => s.trim()).length : 0);
          return (
            <div className="flex flex-col">
              <span className="text-[12px] font-black text-slate-900 leading-none mb-1 tracking-tight">
                {row.exam_title}
              </span>
              <span className="text-[10px] font-bold text-blue-600">
                {count} {count === 1 ? "subject" : "subjects"}
              </span>
            </div>
          );
        },
        sortable: true,
      },
      {
        key: "subject_breakdown",
        label: "Subject breakdown",
        render: (row) => {
          const subjects = row.subjects || [];
          if (subjects.length === 0) {
            return (
              <span className="text-[10px] font-bold text-slate-400">
                —
              </span>
            );
          }
          return (
            <div className="flex flex-wrap gap-1 max-w-[320px]">
              {subjects.map((s) => {
                const isAbsent = s.obtained_marks === -1;
                const pct = s.max_marks > 0 && !isAbsent
                  ? (s.obtained_marks / s.max_marks) * 100
                  : 0;
                const tone = isAbsent
                  ? "bg-rose-50 border-rose-100 text-rose-700"
                  : pct >= 50
                    ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                    : "bg-amber-50 border-amber-100 text-amber-700";
                return (
                  <span
                    key={s.subject_id}
                    title={`${s.subject_name}: ${
                      isAbsent ? "Absent" : `${s.obtained_marks} / ${s.max_marks}`
                    }`}
                    className={`inline-flex items-center gap-1 h-5 px-1.5 rounded-md border text-[9px] font-bold ${tone}`}
                  >
                    <span className="truncate max-w-[80px]">{s.subject_name}</span>
                    <span className="text-slate-500/80">
                      {isAbsent ? "AB" : `${s.obtained_marks}/${s.max_marks}`}
                    </span>
                  </span>
                );
              })}
            </div>
          );
        },
      },
      {
        key: "marks",
        label: "Total",
        render: (row) => {
          const max = row.max_marks || 1;
          const ratio = row.obtained_marks / max;
          const pct = Math.round(ratio * 100);
          return (
            <div className="flex flex-col w-32">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-black text-slate-900">
                  {row.obtained_marks}{" "}
                  <span className="text-slate-400 font-medium">/ {row.max_marks}</span>
                </span>
                <span className="text-[10px] font-black text-blue-600">{pct}%</span>
              </div>
              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    ratio >= 0.4 ? "bg-blue-600" : "bg-rose-500"
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        key: "grade",
        label: "Grade",
        render: (row) => (
          <span
            className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
              row.grade === "F"
                ? "bg-rose-50 text-rose-600 border-rose-100"
                : "bg-blue-50 text-blue-600 border-blue-100"
            }`}
          >
            {row.grade}
          </span>
        ),
      },
      {
        key: "period",
        label: "Graded On",
        render: (row) => (
          <span className="text-[10px] font-bold text-slate-400">
            {new Date(row.graded_at).toLocaleDateString()}
          </span>
        ),
      },
    ],
    []
  );

  const { user } = useAuth();
  const schoolName =
    (user as any)?.schoolName || (user as any)?.school_name || "School";

  const rowActions: RowAction<ResultRow>[] = useMemo(
    () => [
      {
        icon: "visibility",
        label: "View",
        variant: "ghost",
        onClick: (row) => {
          const base = isParent
            ? "/parent"
            : pathname.includes("/teacher")
            ? "/teacher"
            : "/admin";
          navigate(`${base}/results/${row._id}`);
        },
      },
      {
        icon: "download",
        label: "Marksheet",
        variant: "primary",
        onClick: (row) => {
          exportMarksheet(row, { schoolName });
          showToast("Generating marksheet…", "info");
        },
      },
    ],
    [schoolName, navigate, pathname]
  );

  if (state.status === "loading" && !state.data) {
    return <TableSkeleton />;
  }

  if (state.status === "error") {
    return <DataState variant="error" title="Failed to load results" message={state.error} />;
  }

  const examOptions = examState.data || [];

  return (
    <div className="space-y-6">
      <StatCardGrid
        items={[
          { label: "Evaluations", value: stats.total, icon: "grading", accent: "blue" },
          { label: "Success Rate", value: stats.passRate, icon: "verified", accent: "emerald" },
          {
            label: "Avg. Performance",
            value: stats.avgMarks,
            icon: "leaderboard",
            accent: "purple",
          },
          {
            label: "Top Grade",
            value:
              filteredRows.reduce<string>(
                (best, r) => (best === "F" || (r.grade && r.grade < best) ? r.grade : best),
                "F"
              ) || "—",
            icon: "workspace_premium",
            accent: "amber",
          },
        ]}
      />

      {!isParent && (
        <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <AppIcon name="Search" size={18} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                updateQuery({ search: e.target.value });
              }}
              placeholder="Filter by student, exam or subject…"
              className="h-9 w-full rounded-lg border border-slate-50 bg-slate-50/50 pl-9 pr-3 text-[11px] font-bold text-slate-700 outline-none transition-all focus:bg-white focus:border-blue-400"
            />
          </div>

          <select
            value={classFilter}
            onChange={(e) => {
              setClassFilter(e.target.value);
              updateQuery({ class_id: e.target.value });
            }}
            className="h-9 rounded-lg border border-slate-100 bg-white px-3 text-[10px] font-black uppercase text-slate-600 outline-none cursor-pointer"
          >
            <option value="all">All Classes</option>
            {((classState.data as any)?.data || []).map((c: any) => (
              <option key={c.id || c._id} value={c.id || c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {examOptions.length > 0 && (
            <select
              value={examFilter}
              onChange={(e) => {
                setExamFilter(e.target.value);
                updateQuery({ exam_id: e.target.value });
              }}
              className="h-9 rounded-lg border border-slate-100 bg-white px-3 text-[10px] font-black uppercase text-slate-600 outline-none cursor-pointer"
            >
              <option value="all">All Exams</option>
              {examOptions.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.title}
                </option>
              ))}
            </select>
          )}

          <Link
            to={withQuery(
              pathname.includes("/teacher")
                ? "/teacher/results/create"
                : "/admin/results/create"
            )}
            className="h-9 flex items-center gap-2 px-4 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm active:scale-95 transition-all"
          >
            <AppIcon name="BarChart2" size={16} />
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
              <AppIcon name="FileText" size={16} />
              Export Sheet
            </button>
          )}
        </div>
      )}

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
