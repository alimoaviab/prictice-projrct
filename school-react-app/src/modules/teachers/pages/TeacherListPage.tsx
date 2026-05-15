import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  DataTable,
  DataTableColumn,
  RowAction,
  Badge,
  DataState,
  TableSkeleton,
  StatCardGrid,
  Pagination,
  EntityCard,
  EntityGrid,
} from "@/components/ui";
import { useTeachers } from "../hooks/useTeachers";
import { TeacherRow } from "../types/teacher.types";
import { showToast } from "@/utils/toast";
import { useQueryParams } from "@/hooks/useQueryParams";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { usePagination } from "@/hooks/usePagination";

export function TeacherListPage() {
  const navigate = useNavigate();
  const { currentParams, updateQuery, withQuery } = useQueryParams();

  // ─── Filters ────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState(currentParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "on_leave" | "inactive"
  >((currentParams.get("status") as any) || "all");
  const [viewMode, setViewMode] = useState<"grid" | "list">(
    (currentParams.get("view") as any) || "grid"
  );

  // ─── Pagination ─────────────────────────────────────────────────────
  const pagination = usePagination({ defaultLimit: 12 });

  // Reset to page 1 whenever a filter changes (search/status). Without
  // this the user can be left on page 5 of a freshly-empty filter result.
  useEffect(() => {
    pagination.resetToFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter]);

  // ─── Data ───────────────────────────────────────────────────────────
  const { state, meta, deleteTeacher } = useTeachers({
    page: pagination.page,
    limit: pagination.limit,
    status: statusFilter,
    search: searchQuery,
  });

  // Mirror server-side meta into the pagination hook so it can clamp
  // page numbers when the dataset shrinks.
  useEffect(() => {
    if (meta) pagination.applyMeta(meta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.total, meta.pages, meta.page]);

  const [deletingTeacher, setDeletingTeacher] = useState<TeacherRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setSearchQuery(currentParams.get("search") || "");
    setStatusFilter((currentParams.get("status") as any) || "all");
    setViewMode((currentParams.get("view") as any) || "grid");
  }, [currentParams.toString()]);

  function goToEdit(id: string) {
    navigate(`/admin/teachers/edit/${id}`);
  }

  // The backend already filtered + paginated — render rows as-is.
  const rows = state.data ?? [];
  const filteredRows = rows; // Fallback to avoid breaking existing usages

  const stats = useMemo(() => {
    return {
      total: meta.total,
      active: rows.filter((r) => r.status === "active").length,
      onLeave: rows.filter((r) => r.status === "on_leave").length,
    };
  }, [meta.total, rows]);

  const columns: DataTableColumn<TeacherRow>[] = useMemo(() => [
    {
      key: "employee_no",
      label: "ID",
      render: (row) => <span className="font-bold text-[10px] text-blue-600 normal-case ">{row.employee_no}</span>,
    },
    {
      key: "name",
      label: "Name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold normal-case">
            {(row.first_name || "?").substring(0, 1)}{(row.last_name || "").substring(0, 1)}
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-none mb-1">{row.first_name} {row.last_name}</p>
            <p className="text-[10px] text-slate-400 font-bold normal-case tracking-tighter">{row.email}</p>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "qualification",
      label: "Education",
      render: (row) => <span className="text-[11px] font-bold text-slate-600">{row.qualification || "—"}</span>,
    },
    {
      key: "subjects",
      label: "Subjects",
      render: (row) => {
        const subjects = row.subjects || [];
        return (
          <div className="flex flex-wrap gap-1">
            {subjects.slice(0, 2).map((s) => (
              <Badge key={s} variant="secondary" className="text-[9px] font-bold normal-case tracking-tighter px-1.5 py-0">
                {s}
              </Badge>
            ))}
            {subjects.length > 2 && (
              <Badge variant="secondary" className="text-[9px] font-bold px-1.5 py-0 text-slate-400">+{subjects.length - 2}</Badge>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge
          variant={row.status === "active" ? "success" : row.status === "on_leave" ? "warning" : "gray"}
          className="normal-case text-[9px] font-bold normal-case  px-2"
        >
          {(row.status || "unknown").replace("_", " ")}
        </Badge>
      ),
    },
  ], []);

  const rowActions: RowAction<TeacherRow>[] = useMemo(
    () => [
      {
        icon: "edit",
        label: "Edit Record",
        variant: "primary",
        onClick: (row) => goToEdit(row._id),
      },
      {
        icon: "delete",
        label: "Remove",
        variant: "danger",
        onClick: (row) => setDeletingTeacher(row),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleDelete = async () => {
    if (!deletingTeacher) return;
    setIsDeleting(true);
    // Capture how many items are visible BEFORE the delete fires so the
    // pagination hook knows whether the page would become empty.
    const visibleBefore = rows.length;
    try {
      const result = await deleteTeacher(deletingTeacher._id);
      if (result.ok) {
        setDeletingTeacher(null);
        pagination.handleItemRemoved(visibleBefore);
      } else {
        showToast(result.error.message || "Failed to delete teacher", "error");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if ((state.status === "loading" || state.status === "idle") && !state.data) {
    return <TableSkeleton />;
  }

  if (state.status === "error") {
    return (
      <DataState
        variant="error"
        title="Failed to load faculty"
        message={state.error}
      />
    );
  }

  return (
    <div className="space-y-6 relative min-h-[80vh] pb-10">
      {/* Stats */}
      <StatCardGrid
        items={[
          { label: "Total teachers", value: stats.total, icon: "badge", accent: "blue" },
          { label: "Active", value: stats.active, icon: "check_circle", accent: "emerald" },
          { label: "On leave", value: stats.onLeave, icon: "event_busy", accent: "amber" },
          { label: "Subjects covered", value: new Set((state.data || []).flatMap(t => t.subjects || [])).size, icon: "menu_book", accent: "purple" },
        ]}
      />

      {/* Toolbar Section - Unified & Sticky */}
      <div className="premium-card p-2 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/80 backdrop-blur-md border-slate-200/60 shadow-sm rounded-xl">
        <div className="flex flex-1 items-center gap-2 max-w-2xl">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => {
                const value = e.target.value;
                setSearchQuery(value);
                updateQuery({ search: value });
              }}
              placeholder="Search faculty name, ID or qualification..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs font-medium text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-600/5 placeholder:text-slate-400"
            />
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <select
            value={statusFilter}
            onChange={(e) => {
              const value = e.target.value as any;
              setStatusFilter(value);
              updateQuery({ status: value });
            }}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none cursor-pointer transition-all hover:border-slate-300 focus:border-blue-400"
          >
            <option value="all">Status: All</option>
            <option value="active">Active only</option>
            <option value="on_leave">Currently on leave</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg bg-slate-100 p-1 shadow-inner">
            <button
              onClick={() => {
                setViewMode("grid");
                updateQuery({ view: "grid" });
              }}
              className={`flex h-7 items-center gap-2 rounded-md px-3 text-[11px] font-bold transition-all ${
                viewMode === "grid"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="material-symbols-outlined text-base">grid_view</span>
              Grid
            </button>
            <button
              onClick={() => {
                setViewMode("list");
                updateQuery({ view: "list" });
              }}
              className={`flex h-7 items-center gap-2 rounded-md px-3 text-[11px] font-bold transition-all ${
                viewMode === "list"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="material-symbols-outlined text-base">view_list</span>
              List
            </button>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <span className="text-[10px] font-bold text-slate-900 normal-case  px-2 whitespace-nowrap">
            {filteredRows.length} <span className="text-slate-400">records</span>
          </span>
          <div className="h-6 w-px bg-slate-200" />
          <Link
            to={withQuery("/admin/teachers/create")}
            className="inline-flex h-9 items-center gap-2 px-5 text-[11px] font-bold normal-case  text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            Add teacher
          </Link>
        </div>
      </div>

      {/* Content */}
      <div>
        {filteredRows.length === 0 ? (
          <DataState 
            variant="empty" 
            title="No teachers found" 
            message={searchQuery ? "Try refining your search parameters." : "Start by adding your first teacher."} 
          />
        ) : (
          viewMode === "grid" ? (
            <EntityGrid>
              {rows.map((row) => {
                const initials = `${(row.first_name || "?").substring(0, 1)}${(row.last_name || "").substring(0, 1)}`;
                const accent = row.status === "active" ? "blue" : row.status === "on_leave" ? "amber" : "slate";
                
                return (
                  <EntityCard
                    key={row._id}
                  icon={
                    <span className="text-[11px] font-bold">{initials}</span>
                  }
                  accent={accent}
                  title={`${row.first_name} ${row.last_name || ""}`.trim()}
                  subtitle={row.employee_no}
                  status={{
                    label: (row.status || "unknown").replace("_", " "),
                    accent,
                  }}
                  hoverActions={[
                    {
                      label: "Edit teacher",
                      icon: "edit",
                      onClick: () => goToEdit(row._id),
                      accent: "blue",
                    },
                    {
                      label: "Delete teacher",
                      icon: "delete",
                      onClick: () => setDeletingTeacher(row),
                      accent: "rose",
                    },
                  ]}
                  metrics={
                    row.qualification
                      ? [
                          { label: "Qualification", value: row.qualification },
                          {
                            label: "Subjects",
                            value: (row.subjects || []).length || "—",
                          },
                        ]
                      : undefined
                  }
                >
                  {(row.subjects || []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(row.subjects || []).slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md truncate max-w-[100px]"
                        >
                          {s}
                        </span>
                      ))}
                      {(row.subjects || []).length > 3 && (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md">
                          +{(row.subjects || []).length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 pt-2.5 border-t border-slate-100 text-[11px] font-medium text-slate-500 truncate">
                    <span className="material-symbols-outlined text-[13px] shrink-0">mail</span>
                    <span className="truncate">{row.email || "—"}</span>
                  </div>
                </EntityCard>
                );
              })}
            </EntityGrid>
        ) : (
          <div className="premium-card overflow-hidden border-slate-200/60 shadow-sm bg-white rounded-2xl">
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(row) => row._id}
              sortable
              rowActions={rowActions}
            />
          </div>
        ))}
      </div>

      {/* Pagination Footer - Premium ERP Style */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 normal-case ">
          Showing <span className="text-blue-600">1</span> to <span className="text-slate-900">{filteredRows.length}</span> of <span className="text-slate-900">{state.data?.length}</span> records
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

      <ConfirmModal
        isOpen={!!deletingTeacher}
        onCancel={() => setDeletingTeacher(null)}
        onConfirm={handleDelete}
        title="Confirm deletion"
        message={`Are you sure you want to remove ${deletingTeacher?.first_name} ${deletingTeacher?.last_name}? This action is irreversible.`}
        confirmLabel="Remove teacher"
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
