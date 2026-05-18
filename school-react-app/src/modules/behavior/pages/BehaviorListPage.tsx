/**
 * Behavior list page.
 *
 *   /admin/behavior   → review-only. Admin cannot create reports here;
 *                       teachers own that flow from /teacher/behavior/create.
 *                       The "Add Record" CTA is therefore hidden when
 *                       the current path is under /admin.
 *   /teacher/behavior → existing teacher dashboard, unchanged. Teacher
 *                       still gets the create CTA so reports keep flowing.
 *   /parent/behavior  → read-only summary, unchanged.
 *
 * Filters:
 *   - status, severity, category, class, teacher  (server-side via
 *     /api/behavior query params)
 *   - search (name / teacher / category / class / description) is local
 *
 * Stats are derived from the unfiltered list so the cards represent
 * the school's true volume, not the admin's current filter.
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
import { useBehavior } from "../hooks/useBehavior";
import { BehaviorRecordRow } from "../types/behavior.types";
import { useQueryParams } from "@/hooks/useQueryParams";

type StatusFilter =
  | "all"
  | "open"
  | "reviewing"
  | "resolved"
  | "escalated"
  | "dismissed";
type SeverityFilter = "all" | "critical" | "major" | "moderate" | "minor" | "low" | "medium";

export function BehaviorListPage({
  filters,
}: {
  filters?: { student_id?: string; teacher_id?: string; status?: string };
}) {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const isAdmin = pathname.startsWith("/admin");
  const isTeacher = pathname.startsWith("/teacher");
  const isParent = pathname.startsWith("/parent");
  const detailBase = isAdmin
    ? "/admin/behavior"
    : isTeacher
      ? "/teacher/behavior"
      : "/parent/behavior";

  const { currentParams, updateQuery, withQuery } = useQueryParams();
  const { state, deleteBehavior, updateBehavior } = useBehavior(filters);

  const [searchQuery, setSearchQuery] = useState(currentParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    (currentParams.get("status") as StatusFilter) || "all"
  );
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>(
    (currentParams.get("severity") as SeverityFilter) || "all"
  );
  const [categoryFilter, setCategoryFilter] = useState(currentParams.get("category") || "all");
  const [classFilter, setClassFilter] = useState(currentParams.get("class") || "all");
  const [teacherFilter, setTeacherFilter] = useState(currentParams.get("teacher") || "all");
  const [viewMode, setViewMode] = useState<"grid" | "list">(
    (currentParams.get("view") as any) || "grid"
  );

  useEffect(() => {
    setSearchQuery(currentParams.get("search") || "");
    setStatusFilter((currentParams.get("status") as StatusFilter) || "all");
    setSeverityFilter((currentParams.get("severity") as SeverityFilter) || "all");
    setCategoryFilter(currentParams.get("category") || "all");
    setClassFilter(currentParams.get("class") || "all");
    setTeacherFilter(currentParams.get("teacher") || "all");
    setViewMode((currentParams.get("view") as any) || "grid");
  }, [currentParams.toString()]);

  // Derive distinct values from loaded data so the dropdowns auto-fit
  // whatever the school actually has — no hardcoded category lists.
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    (state.data || []).forEach((r) =>
      set.add((r.category || r.incident_type || "").toLowerCase())
    );
    return Array.from(set).filter(Boolean).sort();
  }, [state.data]);
  const classOptions = useMemo(() => {
    const map = new Map<string, string>();
    (state.data || []).forEach((r) => {
      if (r.class_id) map.set(r.class_id, r.class_name || r.class_id);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [state.data]);
  const teacherOptions = useMemo(() => {
    const map = new Map<string, string>();
    (state.data || []).forEach((r) => {
      if (r.teacher_id) map.set(r.teacher_id, r.teacher_name || "Admin");
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [state.data]);

  async function handleStatusUpdate(id: string, status: string) {
    // Toast is already raised by useBehavior on success.
    await updateBehavior(id, { status } as any);
  }

  const columns: DataTableColumn<BehaviorRecordRow>[] = useMemo(
    () => [
      {
        key: "student",
        label: "Student",
        render: (row) => (
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 text-[12px]">{row.student_name}</span>
            <span className="text-[10px] text-slate-500">{row.class_name}</span>
          </div>
        ),
        sortable: true,
        sortFn: (a, b) => a.student_name.localeCompare(b.student_name),
      },
      {
        key: "teacher",
        label: "Reported by",
        render: (row) => (
          <span className="text-[11px] font-medium text-slate-600">
            {row.teacher_name || "Admin"}
          </span>
        ),
      },
      {
        key: "category",
        label: "Category",
        render: (row) => (
          <span className="capitalize text-[11px] font-medium">
            {row.category || row.incident_type}
          </span>
        ),
      },
      {
        key: "severity",
        label: "Severity",
        render: (row) => (
          <Badge
            variant={
              row.severity === "critical"
                ? "error"
                : row.severity === "major"
                  ? "warning"
                  : row.severity === "moderate" || row.severity === "medium"
                    ? "primary"
                    : "success"
            }
            className="capitalize"
          >
            {row.severity}
          </Badge>
        ),
        sortable: true,
      },
      {
        key: "status",
        label: "Status",
        render: (row) => (
          <Badge
            variant={
              row.status === "resolved"
                ? "success"
                : row.status === "open"
                  ? "warning"
                  : row.status === "reviewing"
                    ? "primary"
                    : row.status === "escalated"
                      ? "error"
                      : "gray"
            }
            className="capitalize"
          >
            {row.status.replace("_", " ")}
          </Badge>
        ),
        sortable: true,
      },
    ],
    []
  );

  const rowActions: RowAction<BehaviorRecordRow>[] = useMemo(
    () => [
      {
        icon: "visibility",
        label: "View",
        variant: "ghost",
        onClick: (row) => navigate(`${detailBase}/${row._id}`),
      },
      {
        icon: "play_arrow",
        label: "Review",
        showIf: (row: BehaviorRecordRow) => row.status === "open" && !isParent,
        onClick: (row) => handleStatusUpdate(row._id, "reviewing"),
      },
      {
        icon: "check_circle",
        label: "Resolve",
        variant: "primary",
        showIf: (row: BehaviorRecordRow) => row.status === "reviewing" && !isParent,
        onClick: (row) => handleStatusUpdate(row._id, "resolved"),
      },
      {
        icon: "trending_up",
        label: "Escalate",
        variant: "primary",
        showIf: (row: BehaviorRecordRow) => row.status === "reviewing" && !isParent,
        onClick: (row) => handleStatusUpdate(row._id, "escalated"),
      },
      {
        icon: "cancel",
        label: "Dismiss",
        variant: "ghost",
        showIf: (row: BehaviorRecordRow) => row.status === "reviewing" && !isParent,
        onClick: (row) => handleStatusUpdate(row._id, "dismissed"),
      },
      {
        icon: "delete",
        label: "Delete",
        variant: "danger",
        requireConfirm: true,
        showIf: () => isAdmin,
        onClick: (row) => deleteBehavior(row._id),
      },
    ],
    [navigate, detailBase, isAdmin, isParent, deleteBehavior]
  );

  const filteredRows = useMemo(() => {
    const rows = state.data || [];
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      const queryMatch =
        q.length === 0 ||
        row.student_name.toLowerCase().includes(q) ||
        (row.category || row.incident_type || "").toLowerCase().includes(q) ||
        (row.description || "").toLowerCase().includes(q) ||
        (row.teacher_name || "").toLowerCase().includes(q) ||
        (row.class_name || "").toLowerCase().includes(q);
      const statusMatch = statusFilter === "all" || row.status === statusFilter;
      const severityMatch = severityFilter === "all" || row.severity === severityFilter;
      const categoryMatch =
        categoryFilter === "all" ||
        (row.category || row.incident_type || "").toLowerCase() === categoryFilter;
      const classMatch = classFilter === "all" || row.class_id === classFilter;
      const teacherMatch = teacherFilter === "all" || row.teacher_id === teacherFilter;
      return (
        queryMatch &&
        statusMatch &&
        severityMatch &&
        categoryMatch &&
        classMatch &&
        teacherMatch
      );
    });
  }, [
    state.data,
    searchQuery,
    statusFilter,
    severityFilter,
    categoryFilter,
    classFilter,
    teacherFilter,
  ]);

  const stats = useMemo(() => {
    const data = state.data || [];
    return {
      total: data.length,
      open: data.filter((r) => r.status === "open").length,
      critical: data.filter((r) => r.severity === "critical").length,
      resolved: data.filter((r) => r.status === "resolved").length,
    };
  }, [state.data]);

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setSeverityFilter("all");
    setCategoryFilter("all");
    setClassFilter("all");
    setTeacherFilter("all");
    updateQuery({
      search: "",
      status: "all",
      severity: "all",
      category: "all",
      class: "all",
      teacher: "all",
    });
  }

  const hasActiveFilters =
    searchQuery ||
    statusFilter !== "all" ||
    severityFilter !== "all" ||
    categoryFilter !== "all" ||
    classFilter !== "all" ||
    teacherFilter !== "all";

  if (state.status === "loading" && !state.data) {
    return <TableSkeleton />;
  }
  if (state.status === "error") {
    return (
      <DataState variant="error" title="Error loading behavior records" message={state.error} />
    );
  }

  return (
    <div className="space-y-6 relative min-h-[80vh] pb-10">
      <StatCardGrid
        items={[
          { label: "Total reports", value: stats.total, icon: "gavel", accent: "blue" },
          {
            label: "New / Open",
            value: stats.open,
            icon: "assignment_late",
            accent: "amber",
          },
          {
            label: "Critical priority",
            value: stats.critical,
            icon: "error",
            accent: "rose",
          },
          { label: "Resolved", value: stats.resolved, icon: "task_alt", accent: "emerald" },
        ]}
      />

      <div className="bg-white border border-slate-200 ring-1 ring-slate-900/5 rounded-xl shadow-[0_4px_18px_rgb(0,0,0,0.03)] px-3 py-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-base text-slate-400">
                search
              </span>
              <input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  updateQuery({ search: e.target.value });
                }}
                placeholder="Search student, teacher, category…"
                className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[12px] font-medium text-slate-700 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 placeholder:text-slate-400"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                const v = e.target.value as StatusFilter;
                setStatusFilter(v);
                updateQuery({ status: v });
              }}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-600 outline-none cursor-pointer hover:border-slate-300"
            >
              <option value="all">Status: All</option>
              <option value="open">New / Open</option>
              <option value="reviewing">In review</option>
              <option value="resolved">Resolved</option>
              <option value="escalated">Escalated</option>
              <option value="dismissed">Dismissed</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => {
                const v = e.target.value as SeverityFilter;
                setSeverityFilter(v);
                updateQuery({ severity: v });
              }}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-600 outline-none cursor-pointer hover:border-slate-300"
            >
              <option value="all">Severity: All</option>
              <option value="critical">Critical</option>
              <option value="major">Major</option>
              <option value="moderate">Moderate</option>
              <option value="medium">Medium</option>
              <option value="minor">Minor</option>
              <option value="low">Low</option>
            </select>

            {categoryOptions.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  updateQuery({ category: e.target.value });
                }}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-600 outline-none cursor-pointer hover:border-slate-300 capitalize"
              >
                <option value="all">Category: All</option>
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            {isAdmin && classOptions.length > 0 && (
              <select
                value={classFilter}
                onChange={(e) => {
                  setClassFilter(e.target.value);
                  updateQuery({ class: e.target.value });
                }}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-600 outline-none cursor-pointer hover:border-slate-300"
              >
                <option value="all">Class: All</option>
                {classOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            {isAdmin && teacherOptions.length > 0 && (
              <select
                value={teacherFilter}
                onChange={(e) => {
                  setTeacherFilter(e.target.value);
                  updateQuery({ teacher: e.target.value });
                }}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-600 outline-none cursor-pointer hover:border-slate-300"
              >
                <option value="all">Teacher: All</option>
                {teacherOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-7 inline-flex items-center gap-1 px-2 rounded-md text-[11px] font-bold text-slate-400 hover:text-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
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
                <span className="material-symbols-outlined text-sm">grid_view</span>
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
                <span className="material-symbols-outlined text-sm">view_list</span>
                List
              </button>
            </div>
            <span className="text-[10px] font-bold text-slate-900 px-2 whitespace-nowrap">
              {filteredRows.length}
              <span className="text-slate-400"> reports</span>
            </span>
            {/* Teacher keeps create CTA — admin/parent do not. */}
            {isTeacher && (
              <Link
                to={withQuery("/teacher/behavior/create")}
                className="inline-flex h-9 items-center gap-2 px-4 text-[11px] font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-base">add_circle</span>
                Add report
              </Link>
            )}
          </div>
        </div>
      </div>

      <div>
        {filteredRows.length === 0 ? (
          <DataState
            variant="empty"
            title="No incidents found"
            message={
              hasActiveFilters
                ? "Try refining your search parameters."
                : isAdmin
                  ? "Behavior reports created by teachers will appear here."
                  : "No behavioral incidents have been reported yet."
            }
          />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredRows.map((row) => (
              <div
                key={row._id}
                className="bg-white rounded-xl border border-slate-200 shadow-[0_4px_18px_rgb(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-bold text-slate-900 leading-tight truncate">
                      {row.student_name}
                    </h3>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                      {row.class_name}
                    </p>
                  </div>
                  <Badge
                    variant={
                      row.status === "resolved"
                        ? "success"
                        : row.status === "open"
                          ? "warning"
                          : row.status === "reviewing"
                            ? "primary"
                            : row.status === "escalated"
                              ? "error"
                              : "gray"
                    }
                    className="capitalize text-[8px] font-bold px-2 py-0"
                  >
                    {row.status.replace("_", " ")}
                  </Badge>
                </div>

                <div className="mb-3 p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[8px] font-bold text-slate-400 mb-1 capitalize">
                      Category: {row.category || row.incident_type}
                    </p>
                    <span
                      className={`px-1.5 py-0.5 rounded-md border text-[10px] font-bold ${
                        row.severity === "critical"
                          ? "bg-rose-50 text-rose-600 border-rose-100"
                          : row.severity === "major"
                            ? "bg-amber-50 text-amber-600 border-amber-100"
                            : "bg-white border-slate-100 text-slate-700"
                      } uppercase`}
                    >
                      {row.severity}
                    </span>
                  </div>
                  <div className="text-right pl-3 border-l border-slate-200/50 ml-3">
                    <p className="text-xs font-bold text-slate-900 leading-none">
                      {row.warning_count}
                    </p>
                    <p className="text-[7px] font-bold text-slate-400 mt-0.5">Warnings</p>
                  </div>
                </div>

                <p className="text-[10px] font-medium text-slate-500 line-clamp-2 leading-relaxed italic">
                  "{row.description || "No detailed description provided."}"
                </p>
                <p className="text-[8px] font-bold text-slate-400 mt-2">
                  Reported by: {row.teacher_name || "Admin"}
                </p>

                <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`${detailBase}/${row._id}`)}
                    className="text-[10px] font-bold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    View
                  </button>

                  {row.status === "open" && !isParent && (
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(row._id, "reviewing")}
                      className="h-7 px-3 rounded-lg bg-blue-600 text-[10px] font-bold text-white hover:bg-blue-700 transition-all flex items-center gap-1 shadow-sm active:scale-95"
                    >
                      Review
                      <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                    </button>
                  )}
                  {row.status === "reviewing" && !isParent && (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(row._id, "resolved")}
                        className="h-7 px-2.5 rounded-lg bg-emerald-600 text-[10px] font-bold text-white hover:bg-emerald-700 inline-flex items-center gap-1 shadow-sm"
                      >
                        Resolve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(row._id, "escalated")}
                        className="h-7 px-2.5 rounded-lg bg-amber-600 text-[10px] font-bold text-white hover:bg-amber-700 inline-flex items-center gap-1 shadow-sm"
                      >
                        Escalate
                      </button>
                    </div>
                  )}
                  {(row.status === "resolved" ||
                    row.status === "dismissed" ||
                    row.status === "escalated") && (
                    <span className="text-[9px] font-bold text-slate-400 inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">history</span>
                      Finalized
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_18px_rgb(0,0,0,0.03)] overflow-hidden">
            <DataTable
              columns={columns}
              rows={filteredRows}
              rowKey={(row) => row._id}
              sortable
              paginated={10}
              rowActions={
                isParent ? rowActions.filter((a) => a.label === "View") : rowActions
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
