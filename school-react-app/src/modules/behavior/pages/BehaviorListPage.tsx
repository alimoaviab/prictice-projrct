import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import {
  DataTable,
  DataTableColumn,
  RowAction,
  Badge,
  DataState,
  TableSkeleton,
  Skeleton,
  StatCardGrid,
} from "@/components/ui";
import { useBehavior } from "../hooks/useBehavior";
import { BehaviorRecordRow } from "../types/behavior.types";
import { showToast } from "@/utils/toast";
import { useQueryParams } from "@/hooks/useQueryParams";

export function BehaviorListPage({ filters }: { filters?: { student_id?: string; teacher_id?: string; status?: string } }) {
  const pathname = useLocation().pathname;
  const { currentParams, updateQuery, withQuery } = useQueryParams();
  const { state, deleteBehavior, updateBehavior } = useBehavior(filters);
  const [searchQuery, setSearchQuery] = useState(currentParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "reviewing" | "resolved" | "escalated" | "dismissed">((currentParams.get("status") as any) || "all");
  const [viewMode, setViewMode] = useState<"grid" | "list">((currentParams.get("view") as any) || "grid");

  useEffect(() => {
    setSearchQuery(currentParams.get("search") || "");
    setStatusFilter((currentParams.get("status") as any) || "all");
    setViewMode((currentParams.get("view") as any) || "grid");
  }, [currentParams.toString()]);

  const handleStatusUpdate = async (id: string, status: string) => {
    const res = await updateBehavior(id, { status } as any);
    if (res.ok) {
      showToast(`Incident marked as ${status.replace("_", " ")}`, "success");
    }
  };

  const columns: DataTableColumn<BehaviorRecordRow>[] = useMemo(() => [
    {
      key: "student",
      label: "Student",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{row.student_name}</span>
          <span className="text-xs text-gray-500">{row.class_name}</span>
        </div>
      ),
      sortable: true,
      sortFn: (a, b) => a.student_name.localeCompare(b.student_name),
    },
    {
      key: "teacher",
      label: "Reported By",
      render: (row) => <span className="text-xs font-medium text-slate-600">{row.teacher_name || "Admin"}</span>,
    },
    {
      key: "category",
      label: "Category",
      render: (row) => <span className="capitalize">{row.category || row.incident_type}</span>,
    },
    {
      key: "severity",
      label: "Severity",
      render: (row) => (
        <Badge
          variant={
            row.severity === "critical" ? "error" :
              row.severity === "major" ? "warning" :
                row.severity === "moderate" || row.severity === "medium" ? "primary" :
                  "success"
          }
          className="normal-case"
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
            row.status === "resolved" ? "success" :
              row.status === "open" ? "warning" :
                row.status === "reviewing" ? "primary" :
                  row.status === "escalated" ? "error" :
                    "gray"
          }
          className="normal-case"
        >
          {row.status.replace("_", " ")}
        </Badge>
      ),
      sortable: true,
    },
  ], []);

  const rowActions: RowAction<BehaviorRecordRow>[] = useMemo(() => [
    {
      icon: "play_arrow",
      label: "Review",
      showIf: (row: BehaviorRecordRow) => row.status === "open",
      onClick: (row) => handleStatusUpdate(row._id, "reviewing"),
    },
    {
      icon: "check_circle",
      label: "Resolve",
      variant: "primary",
      showIf: (row: BehaviorRecordRow) => row.status === "reviewing",
      onClick: (row) => handleStatusUpdate(row._id, "resolved"),
    },
    {
      icon: "trending_up",
      label: "Escalate",
      variant: "primary",
      showIf: (row: BehaviorRecordRow) => row.status === "reviewing",
      onClick: (row) => handleStatusUpdate(row._id, "escalated"),
    },
    {
      icon: "cancel",
      label: "Dismiss",
      variant: "ghost",
      showIf: (row: BehaviorRecordRow) => row.status === "reviewing",
      onClick: (row) => handleStatusUpdate(row._id, "dismissed"),
    },
    {
      icon: "delete",
      label: "Delete",
      variant: "danger",
      requireConfirm: true,
      onClick: (row) => deleteBehavior(row._id),
    },
  ], [pathname]);

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
      const statusMatch = statusFilter === "all" ? true : row.status === statusFilter;
      return queryMatch && statusMatch;
    });
  }, [state.data, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const data = state.data || [];
    return {
      total: data.length,
      open: data.filter(r => r.status === 'open').length,
      critical: data.filter(r => r.severity === 'critical').length,
      resolved: data.filter(r => r.status === 'resolved').length,
    };
  }, [state.data]);

  if (state.status === "loading" && !state.data) {
    return <TableSkeleton />;
  }

  if (state.status === "error") {
    return <DataState variant="error" title="Error Loading Behavior Records" message={state.error} />;
  }

  return (
    <div className="space-y-6 relative min-h-[80vh] pb-10">
      {/* Stats Section */}
      <StatCardGrid
        items={[
          { label: "Total Incidents", value: stats.total, icon: "gavel", accent: "blue" },
          { label: "New / Open", value: stats.open, icon: "assignment_late", accent: "amber" },
          { label: "Critical Priority", value: stats.critical, icon: "error", accent: "rose" },
          { label: "Resolved", value: stats.resolved, icon: "task_alt", accent: "emerald" },
        ]}
      />

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
              placeholder="Search student, teacher, or category..."
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
            <option value="open">New / Open</option>
            <option value="reviewing">In Review</option>
            <option value="resolved">Resolved</option>
            <option value="escalated">Escalated</option>
            <option value="dismissed">Dismissed</option>
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
                viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
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
                viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span className="material-symbols-outlined text-base">view_list</span>
              List
            </button>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <span className="text-[10px] font-bold text-slate-900 normal-case  px-2 whitespace-nowrap">
            {filteredRows.length} <span className="text-slate-400">INCIDENTS</span>
          </span>
          <div className="h-6 w-px bg-slate-200" />
          {!pathname.includes("/parent") && (
            <Link
              to={withQuery(pathname.includes("/teacher") ? "/teacher/behavior/create" : "/admin/behavior/create")}
              className="inline-flex h-9 items-center gap-2 px-5 text-[11px] font-bold normal-case  text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              Add Record
            </Link>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {state.status === "loading" && !state.data ? (
          <TableSkeleton />
        ) : filteredRows.length === 0 ? (
          <DataState 
            variant="empty" 
            title="No Incidents Found" 
            message={searchQuery ? "Try refining your search parameters." : "No behavioral incidents have been reported yet."} 
          />
        ) : (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {filteredRows.map((row) => (
                <div key={row._id} className="premium-card group relative flex flex-col p-4 transition-all duration-300 bg-white border-slate-200/60 hover:shadow-xl hover:shadow-slate-200/30 hover:-translate-y-0.5">
                  {/* Top Row: Student & Status */}
                  <div className="flex items-start justify-between gap-4 mb-3.5">
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <h3 className="text-[13px] font-bold text-slate-900 tracking-tight leading-tight truncate group-hover:text-blue-600 transition-colors">
                        {row.student_name}
                      </h3>
                      <p className="text-[9px] font-bold text-slate-400 normal-case  mt-1">{row.class_name}</p>
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge
                        variant={
                          row.status === "resolved" ? "success" :
                          row.status === "open" ? "warning" : 
                          row.status === "reviewing" ? "primary" : 
                          row.status === "escalated" ? "error" : "gray"
                        }
                        className="text-[8px] font-bold normal-case  px-2 py-0"
                      >
                        {row.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>

                  {/* Middle Row: Incident Detail (Pill Style) */}
                  <div className="mb-4 p-3 rounded-xl bg-slate-50/50 border border-slate-100/50 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-[8px] font-bold text-slate-400 normal-case  mb-1.5">Category: {row.category || row.incident_type}</p>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-700">
                        <span className={`px-1.5 py-0.5 rounded-md border ${
                          row.severity === 'critical' ? 'bg-red-50 text-red-600 border-red-100' : 
                          row.severity === 'major' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-white border-slate-100'
                        }`}>
                          {row.severity.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right pl-3 border-l border-slate-200/50 ml-3">
                       <p className="text-xs font-bold text-slate-900 leading-none">{row.warning_count}</p>
                       <p className="text-[7px] font-bold text-slate-400 normal-case  mt-0.5">Warnings</p>
                    </div>
                  </div>

                  {/* Narrative Preview */}
                  <div className="mb-4 px-0.5">
                     <p className="text-[10px] font-medium text-slate-500 line-clamp-2 leading-relaxed italic">
                       "{row.description || "No detailed description provided."}"
                     </p>
                     <p className="text-[8px] font-bold text-slate-400 normal-case  mt-2">Reported by: {row.teacher_name || "Admin"}</p>
                  </div>

                  {/* Bottom Row: Actions */}
                  <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between gap-2">
                    {row.status === "open" && !pathname.includes("/parent") && (
                      <button 
                        onClick={() => handleStatusUpdate(row._id, "reviewing")}
                        className="flex-1 h-7 rounded-lg bg-blue-600 text-[9px] font-bold text-white normal-case  hover:bg-blue-700 transition-all flex items-center justify-center gap-1 shadow-md active:scale-95"
                      >
                          Review Incident
                          <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                      </button>
                    )}
                    {row.status === "reviewing" && !pathname.includes("/parent") && (
                      <div className="flex gap-1 w-full">
                        <button 
                          onClick={() => handleStatusUpdate(row._id, "resolved")}
                          className="flex-1 h-7 rounded-lg bg-emerald-600 text-[9px] font-bold text-white normal-case  hover:bg-emerald-700 transition-all flex items-center justify-center gap-1 shadow-md active:scale-95"
                          title="Mark Resolved"
                        >
                            Resolve
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(row._id, "escalated")}
                          className="flex-1 h-7 rounded-lg bg-amber-600 text-[9px] font-bold text-white normal-case  hover:bg-amber-700 transition-all flex items-center justify-center gap-1 shadow-md active:scale-95"
                          title="Escalate Issue"
                        >
                            Escalate
                            <span className="material-symbols-outlined text-[14px]">trending_up</span>
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(row._id, "dismissed")}
                          className="h-7 w-7 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all flex items-center justify-center shadow-sm active:scale-95"
                          title="Dismiss Incident"
                        >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    )}
                    {(row.status === "resolved" || row.status === "dismissed" || row.status === "escalated") && (
                      <div className="flex items-center gap-2 text-slate-400 py-1">
                        <span className="material-symbols-outlined text-sm">history</span>
                        <span className="text-[9px] font-bold normal-case ">Finalized Status</span>
                      </div>
                    )}
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
                rowActions={pathname.includes("/parent") ? rowActions.filter(a => a.label === "View Details") : rowActions}
              />
            </div>
          )
        )}
      </div>

      {/* Pagination Footer - Premium ERP Style */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 normal-case ">
          Showing <span className="text-blue-600">1</span> to <span className="text-slate-900">{filteredRows.length}</span> of <span className="text-slate-900">{state.data?.length}</span> Incident Records
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
