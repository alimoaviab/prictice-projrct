import { AppIcon } from "shared/ui/AppIcon";
/**
 * /admin/exams — Exam list page.
 *
 * Architecture: one card == one exam. Each card shows the subjects
 * embedded inside the exam as small chips so admins can see at a
 * glance what the exam covers without opening it. Clicking "Add
 * marks" opens the unified marks entry page where every subject is a
 * column.
 */

import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  DataTable,
  DataTableColumn,
  RowAction,
  Badge,
  DataState,
  Skeleton,
  StatCardGrid,
  EntityGridSkeleton,
} from "@/components/ui";
import { useExams } from "../hooks/useExams";
import { ExamRow } from "../types/exam.types";
import { useQueryParams } from "@/hooks/useQueryParams";

export function ExamListPage({
  filters,
}: {
  filters?: { class_id?: string; subject?: string };
}) {
  const pathname = useLocation().pathname;
  const isParent = pathname.includes("/parent");
  const isTeacher = pathname.includes("/teacher");
  const marksBase = isTeacher ? "/teacher/exams/marks" : "/admin/exams/marks";
  const examsCreatePath = isTeacher ? "/teacher/exams/create" : "/admin/exams/create";
  const { currentParams, updateQuery, withQuery } = useQueryParams();

  const [searchQuery, setSearchQuery] = useState(currentParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "scheduled" | "completed" | "cancelled"
  >((currentParams.get("status") as any) || "all");
  const [viewMode, setViewMode] = useState<"grid" | "list">(
    (currentParams.get("view") as any) || "grid"
  );

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
      const subjectsConcat = (row.subjects || [])
        .filter((s) => s)
        .map((s) => s?.subject_name || "")
        .join(" ")
        .toLowerCase();
      const queryMatch =
        q.length === 0 ||
        row.title.toLowerCase().includes(q) ||
        (row.subject || "").toLowerCase().includes(q) ||
        subjectsConcat.includes(q);
      const statusMatch = statusFilter === "all" || row.status === statusFilter;
      return queryMatch && statusMatch;
    });
  }, [state.data, searchQuery, statusFilter]);

  const columns: DataTableColumn<ExamRow>[] = [
    {
      key: "title",
      label: "Name",
      render: (row) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="text-[12px] font-black text-slate-900 leading-none tracking-tight">
              {row.title}
            </span>
            {row.term && (
              <Badge variant="secondary" className="text-[8px] font-extrabold px-1 py-0">
                {row.term}
              </Badge>
            )}
          </div>
          <span className="text-[10px] text-slate-500 font-bold tracking-tight truncate max-w-[260px]">
            {row.subject_count || (row.subjects || []).length} subj ·{" "}
            {(row.subjects || []).filter((s) => s).map((s) => s?.subject_name || "Unknown").join(", ") || row.subject}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "date",
      label: "Date",
      render: (row) => (
        <span className="text-[11px] font-medium text-slate-600">{row.starts_at}</span>
      ),
    },
    {
      key: "max_marks",
      label: "Marks",
      render: (row) => (
        <span className="text-[11px] font-bold text-slate-700">{row.max_marks}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge
          variant={
            row.status === "completed"
              ? "success"
              : row.status === "scheduled"
                ? "primary"
                : "gray"
          }
          className="text-[9px] font-bold px-2 py-0.5"
        >
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
          label: "Add marks",
          variant: "primary",
          onClick: (row) => {
            window.location.assign(`${marksBase}?exam_id=${encodeURIComponent(row._id)}`);
          },
        },
      ];

  if (state.status === "loading" || state.status === "idle") {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[52px] w-full rounded-xl" />
        <EntityGridSkeleton count={6} />
      </div>
    );
  }

  if (state.status === "error") {
    return <DataState variant="error" title="Sync error" message={state.error} />;
  }

  return (
    <div className="space-y-5">
      <StatCardGrid
        items={[
          {
            label: "Total exams",
            value: state.data?.length || 0,
            icon: "quiz",
            accent: "blue",
          },
          {
            label: "Upcoming",
            value: state.data?.filter((e) => e.status === "scheduled").length || 0,
            icon: "event",
            accent: "purple",
          },
          {
            label: "Completed",
            value: state.data?.filter((e) => e.status === "completed").length || 0,
            icon: "task_alt",
            accent: "emerald",
          },
          {
            label: "Pending results",
            value:
              state.data?.filter(
                (e) => e.status === "scheduled" && (e.results_count || 0) === 0
              ).length || 0,
            icon: "pending",
            accent: "amber",
          },
        ]}
      />

      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white rounded-xl border border-slate-200 ring-1 ring-slate-900/5 px-3 py-2.5 shadow-[0_4px_18px_rgb(0,0,0,0.03)]">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-[220px]">
            <AppIcon name="Search" size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                updateQuery({ search: e.target.value });
              }}
              placeholder="Search exams…"
              className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[12px] font-medium text-slate-700 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 placeholder:text-slate-400"
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
            <option value="all">All</option>
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
              className="h-7 inline-flex items-center gap-1 px-2 rounded-md text-[11px] font-bold text-slate-400 hover:text-slate-700 transition-colors"
            >
              <AppIcon name="X" size={14} />
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center bg-slate-50 rounded-lg border border-slate-200 p-0.5">
            <button
              type="button"
              onClick={() => {
                setViewMode("grid");
                updateQuery({ view: "grid" });
              }}
              className={`h-7 px-2 rounded-md flex items-center gap-1 text-[11px] font-bold transition-colors ${
                viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
              }`}
            >
              <AppIcon name="LayoutGrid" size={14} />
              Grid
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("list");
                updateQuery({ view: "list" });
              }}
              className={`h-7 px-2 rounded-md flex items-center gap-1 text-[11px] font-bold transition-colors ${
                viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
              }`}
            >
              <AppIcon name="ViewList" size={14} />
              List
            </button>
          </div>

          {!isParent && (
            <Link
              to={withQuery(examsCreatePath)}
              className="h-9 inline-flex items-center gap-2 px-4 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm active:scale-95 transition-all"
            >
              <AppIcon name="Plus" size={16} />
              Add exam
            </Link>
          )}
        </div>
      </div>

      {/* Content */}
      {filteredRows.length === 0 ? (
        <DataState
          variant="empty"
          title="No exams found"
          message="No upcoming or past exams found for the selected criteria."
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredRows.map((exam) => (
            <ExamCard
              key={exam._id}
              exam={exam}
              marksBase={marksBase}
              isParent={isParent}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 ring-1 ring-slate-900/5 shadow-[0_4px_18px_rgb(0,0,0,0.03)] overflow-hidden">
          <DataTable
            columns={columns}
            rows={filteredRows}
            rowKey={(row) => row._id}
            rowActions={rowActions}
          />
        </div>
      )}
    </div>
  );
}

// ─── ExamCard ──────────────────────────────────────────────────────────

function ExamCard({
  exam,
  marksBase,
  isParent,
}: {
  exam: ExamRow;
  marksBase: string;
  isParent: boolean;
}) {
  const subjects = exam.subjects || [];
  const subjectCount = exam.subject_count || subjects.length;

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:border-blue-200 transition-all flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <AppIcon name="FileText" size={18} />
          </div>
          {exam.term && (
            <Badge variant="secondary" className="text-[8px] font-extrabold px-1.5 py-0.5">
              {exam.term}
            </Badge>
          )}
        </div>
        <Badge
          variant={exam.status === "completed" ? "success" : "primary"}
          className="text-[8px] font-black tracking-widest px-2 py-0.5"
        >
          {exam.status}
        </Badge>
      </div>

      <h3 className="text-[13px] font-black text-slate-900 mb-0.5 truncate">{exam.title}</h3>
      <p className="text-[10px] font-bold text-slate-400 tracking-tight mb-2">
        {exam.class_name || "—"}
      </p>

      {/* Subject chips. Wrap, cap visible at 6, then "+N more". */}
      <div className="flex flex-wrap gap-1 mb-3 min-h-[20px]">
        {subjects.filter((s) => s).slice(0, 6).map((s) => (
          <span
            key={s?.subject_id}
            className="inline-flex items-center gap-1 h-5 px-1.5 rounded-md bg-slate-50 border border-slate-100 text-[9px] font-bold text-slate-700 truncate max-w-[110px]"
            title={`${s?.subject_name || "Unknown"} · max ${s?.max_marks || 0}`}
          >
            {s?.subject_name || "Unknown"}
          </span>
        ))}
        {subjects.length > 6 && (
          <span className="inline-flex items-center h-5 px-1.5 rounded-md bg-slate-100 text-[9px] font-bold text-slate-600">
            +{subjects.length - 6} more
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-50 text-[10px] font-bold">
        <div className="flex items-center gap-2">
          <AppIcon name="Calendar" size={14} className="text-slate-300" />
          <span className="text-slate-400">{exam.starts_at}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <span>{subjectCount} subj</span>
          <span className="h-1 w-1 rounded-full bg-slate-200" />
          <span>{exam.max_marks} pts</span>
        </div>
      </div>

      {!isParent && (
        <Link
          to={`${marksBase}?exam_id=${encodeURIComponent(exam._id)}`}
          className="mt-3 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all"
        >
          <AppIcon name="FileText" size={14} />
          Add marks
        </Link>
      )}
    </div>
  );
}
