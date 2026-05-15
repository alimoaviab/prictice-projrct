/**
 * /admin/tests — Test management dashboard.
 *
 * Layout (matches timetable/homework dashboard pattern):
 *   1. 4-up summary stat tiles
 *   2. Compact toolbar (search, status filter, view toggle, CTA)
 *   3. 3-column responsive card grid (desktop) with compact cards
 *   4. Proper empty state
 *
 * Grid: 3 cols desktop, 2 cols tablet, 1 col mobile.
 * Cards: compact, status-bar left edge, tight spacing, clear hierarchy.
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
} from "@/components/ui";
import { useTests } from "../hooks/useTests";
import { TestRow } from "../types/test.types";
import { useQueryParams } from "@/hooks/useQueryParams";

export function TestListPage({ filters }: { filters?: { class_id?: string; subject?: string } }) {
  const pathname = useLocation().pathname;
  const isParent = pathname.includes("/parent");
  const isTeacher = pathname.includes("/teacher");
  const marksBase = isTeacher ? "/teacher/tests/marks" : "/admin/tests/marks";
  const testsCreatePath = isTeacher ? "/teacher/tests/create" : "/admin/tests/create";
  const { currentParams, updateQuery, withQuery } = useQueryParams();

  const [searchQuery, setSearchQuery] = useState(currentParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState<"all" | "scheduled" | "completed" | "cancelled">(
    (currentParams.get("status") as any) || "all"
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">(
    (currentParams.get("view") as any) || "grid"
  );

  const { state } = useTests(filters);

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
      const statusMatch = statusFilter === "all" || row.status === statusFilter;
      return queryMatch && statusMatch;
    });
  }, [state.data, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const all = state.data || [];
    return {
      total: all.length,
      scheduled: all.filter((e) => e.status === "scheduled").length,
      completed: all.filter((e) => e.status === "completed").length,
      pending: all.filter((e) => e.status === "scheduled" && (e.results_count || 0) === 0).length,
    };
  }, [state.data]);

  // ─── Table columns (list view) ────────────────────────────────────────

  const columns: DataTableColumn<TestRow>[] = [
    {
      key: "title",
      label: "Test",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-[12px] font-bold text-slate-900 leading-tight">{row.title}</span>
          <span className="text-[10px] text-blue-600 font-bold mt-0.5">{row.subject}</span>
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
          variant={row.status === "completed" ? "success" : row.status === "scheduled" ? "primary" : "gray"}
          className="text-[9px] font-bold px-2 py-0.5"
        >
          {row.status}
        </Badge>
      ),
    },
  ];

  const rowActions: RowAction<TestRow>[] = isParent
    ? []
    : [
        {
          icon: "edit_note",
          label: "Enter Marks",
          variant: "primary",
          onClick: (row) => {
            window.location.assign(`${marksBase}?test_id=${encodeURIComponent(row._id)}`);
          },
        },
      ];

  // ─── Loading ───────────────────────────────────────────────────────────

  if (state.status === "loading" || state.status === "idle") {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[52px] w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[130px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return <DataState variant="error" title="Failed to load tests" message={state.error} />;
  }

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ─── Stats ────────────────────────────────────────────────────── */}
      <StatCardGrid
        items={[
          { label: "Total Tests", value: stats.total, icon: "quiz", accent: "blue" },
          { label: "Upcoming", value: stats.scheduled, icon: "event", accent: "purple" },
          { label: "Completed", value: stats.completed, icon: "task_alt", accent: "emerald" },
          { label: "Results Pending", value: stats.pending, icon: "pending", accent: "amber" },
        ]}
      />

      {/* ─── Toolbar ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white rounded-xl border border-slate-200 ring-1 ring-slate-900/5 px-3 py-2.5 shadow-[0_4px_18px_rgb(0,0,0,0.03)]">
        <div className="flex flex-1 items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 max-w-[220px]">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-base text-slate-400">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                updateQuery({ search: e.target.value });
              }}
              placeholder="Search tests…"
              className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[12px] font-medium text-slate-700 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 placeholder:text-slate-400"
            />
          </div>

          {/* Status filter */}
          <div className="inline-flex items-center bg-slate-50 rounded-lg border border-slate-200 p-0.5">
            {(["all", "scheduled", "completed"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setStatusFilter(s);
                  updateQuery({ status: s });
                }}
                className={`h-7 px-2.5 rounded-md text-[11px] font-bold transition-colors capitalize ${
                  statusFilter === s
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {(searchQuery || statusFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                updateQuery({ search: "", status: "all" });
              }}
              className="h-7 inline-flex items-center gap-1 px-2 rounded-md text-[11px] font-bold text-slate-400 hover:text-slate-700 transition-colors"
              title="Clear filters"
            >
              <span className="material-symbols-outlined text-sm">close</span>
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="inline-flex items-center bg-slate-50 rounded-lg border border-slate-200 p-0.5">
            <button
              type="button"
              onClick={() => { setViewMode("grid"); updateQuery({ view: "grid" }); }}
              className={`h-7 px-2 rounded-md flex items-center gap-1 text-[11px] font-bold transition-colors ${
                viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
              }`}
            >
              <span className="material-symbols-outlined text-sm">grid_view</span>
              Grid
            </button>
            <button
              type="button"
              onClick={() => { setViewMode("list"); updateQuery({ view: "list" }); }}
              className={`h-7 px-2 rounded-md flex items-center gap-1 text-[11px] font-bold transition-colors ${
                viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
              }`}
            >
              <span className="material-symbols-outlined text-sm">view_list</span>
              List
            </button>
          </div>

          {/* Create CTA */}
          {!isParent && (
            <Link
              to={withQuery(testsCreatePath)}
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-blue-600 text-white text-[12px] font-bold shadow-sm shadow-blue-600/15 hover:bg-blue-700 transition-colors active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-base">add</span>
              New test
            </Link>
          )}
        </div>
      </div>

      {/* ─── Content ──────────────────────────────────────────────────── */}
      {filteredRows.length === 0 ? (
        <EmptyState
          hasFilters={!!searchQuery || statusFilter !== "all"}
          onClear={() => {
            setSearchQuery("");
            setStatusFilter("all");
            updateQuery({ search: "", status: "all" });
          }}
          createPath={isParent ? undefined : withQuery(testsCreatePath)}
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredRows.map((test) => (
            <TestCard
              key={test._id}
              test={test}
              marksBase={marksBase}
              isParent={isParent}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 ring-1 ring-slate-900/5 shadow-[0_4px_18px_rgb(0,0,0,0.03)] overflow-hidden">
          <DataTable columns={columns} rows={filteredRows} rowKey={(row) => row._id} rowActions={rowActions} />
        </div>
      )}
    </div>
  );
}

// ─── TestCard (compact, 3-per-row) ───────────────────────────────────────

function TestCard({
  test,
  marksBase,
  isParent,
}: {
  test: TestRow;
  marksBase: string;
  isParent: boolean;
}) {
  const statusColor =
    test.status === "completed"
      ? "bg-emerald-500"
      : test.status === "scheduled"
        ? "bg-blue-500"
        : "bg-slate-400";

  const statusBadge =
    test.status === "completed"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : test.status === "scheduled"
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <div className="group relative bg-white rounded-xl border border-slate-200 ring-1 ring-slate-900/5 shadow-[0_2px_8px_rgb(0,0,0,0.02)] hover:shadow-[0_4px_14px_rgb(0,0,0,0.05)] transition-shadow overflow-hidden">
      {/* Status bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${statusColor}`} />

      <div className="px-4 py-3">
        {/* Top: icon + status */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <span className="material-symbols-outlined text-base">description</span>
          </div>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider ${statusBadge}`}
          >
            {test.status}
          </span>
        </div>

        {/* Title + subject */}
        <h4 className="text-[13px] font-bold text-slate-900 tracking-tight leading-tight truncate mb-0.5">
          {test.title}
        </h4>
        <p className="text-[11px] font-medium text-blue-600 truncate mb-3">
          {test.subject}
        </p>

        {/* Meta row: date + marks */}
        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <span className="material-symbols-outlined text-[13px]">calendar_today</span>
            {test.starts_at || "—"}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
            <span className="material-symbols-outlined text-[13px]">grade</span>
            {test.max_marks} pts
          </div>
        </div>

        {/* Action button */}
        {!isParent && (
          <Link
            to={`${marksBase}?test_id=${encodeURIComponent(test._id)}`}
            className="mt-2.5 w-full inline-flex h-7 items-center justify-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
          >
            <span className="material-symbols-outlined text-[13px]">edit_note</span>
            Enter Marks
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────

function EmptyState({
  hasFilters,
  onClear,
  createPath,
}: {
  hasFilters: boolean;
  onClear: () => void;
  createPath?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 ring-1 ring-slate-900/5 shadow-[0_4px_18px_rgb(0,0,0,0.03)] px-6 py-10 text-center">
      <div className="flex flex-col items-center justify-center gap-4 max-w-sm mx-auto">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <span className="material-symbols-outlined text-2xl">quiz</span>
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            {hasFilters ? "No tests match your filters" : "No tests scheduled"}
          </h3>
          <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
            {hasFilters
              ? "Try adjusting your search or status filter."
              : "Schedule your first test and it will appear here."}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2">
          {hasFilters && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-slate-200 bg-white text-[12px] font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700 transition-colors"
            >
              <span className="material-symbols-outlined text-base">filter_alt_off</span>
              Clear filters
            </button>
          )}
          {createPath && !hasFilters && (
            <Link
              to={createPath}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 text-white text-[12px] font-bold shadow-sm shadow-blue-600/15 hover:bg-blue-700 transition-colors active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Schedule first test
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
