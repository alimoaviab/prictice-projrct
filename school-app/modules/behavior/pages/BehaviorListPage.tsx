"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DataTable,
  DataTableColumn,
  RowAction,
  Badge,
  DataState,
  TableSkeleton,
  Skeleton,
} from "../../../components/ui";
import { useBehavior } from "../hooks/useBehavior";
import { BehaviorRecordRow } from "../types/behavior.types";
import { showToast } from "../../../utils/toast";

export function BehaviorListPage({ filters }: { filters?: { student_id?: string; teacher_id?: string; status?: string } }) {
  const pathname = usePathname();
  const { state, deleteBehavior } = useBehavior(filters);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "resolved" | "under_review">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const handleDelete = async (id: string) => {
    const result = await deleteBehavior(id);
    if (!result.success) {
      showToast(result.message || "Failed to delete record", "error");
    } else {
      showToast("Record deleted", "success");
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
      key: "incident_type",
      label: "Type",
      render: (row) => <span className="normal-case">{row.incident_type.replace("_", " ")}</span>,
      sortable: true,
    },
    {
      key: "severity",
      label: "Severity",
      render: (row) => (
        <Badge
          variant={
            row.severity === "critical" ? "error" :
              row.severity === "major" ? "warning" :
                row.severity === "moderate" ? "primary" :
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
                row.status === "under_review" ? "primary" :
                  "error"
          }
          className="normal-case"
        >
          {row.status.replace("_", " ")}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: "warnings",
      label: "Warnings",
      render: (row) => <span>{row.warning_count}</span>,
      sortable: true,
    },
    {
      key: "parent_notified",
      label: "Parent Notified",
      render: (row) => (
        <Badge variant={row.parent_notified ? "success" : "gray"}>
          {row.parent_notified ? "Yes" : "No"}
        </Badge>
      ),
    },
  ], []);

  const rowActions: RowAction<BehaviorRecordRow>[] = useMemo(() => [
    {
      icon: "visibility",
      label: "View Details",
      variant: "primary",
      onClick: (row) => {
        alert(`Student: ${row.student_name}\nType: ${row.incident_type}\nSeverity: ${row.severity}\nStatus: ${row.status}\n\nDescription: ${row.description || "N/A"}`);
      },
    },
    {
      icon: "delete",
      label: "Delete",
      variant: "danger",
      requireConfirm: true,
      confirmTitle: "Delete Record",
      confirmMessage: (row) => `Are you sure you want to delete the behavior record for ${row.student_name}?`,
      onClick: (row) => handleDelete(row._id),
    },
  ], [pathname]);

  const filteredRows = useMemo(() => {
    const rows = state.data || [];
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      const queryMatch =
        q.length === 0 ||
        row.student_name.toLowerCase().includes(q) ||
        row.incident_type.toLowerCase().includes(q) ||
        (row.description || "").toLowerCase().includes(q) ||
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
    <div className="space-y-8 relative min-h-[80vh] pb-10">
      {/* Stats Section - Premium ERP Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Incidents", value: stats.total, icon: "analytics", color: "text-blue-600", bg: "bg-blue-600/5" },
          { label: "Open Issues", value: stats.open, icon: "assignment_late", color: "text-amber-600", bg: "bg-amber-600/5" },
          { label: "Critical Priority", value: stats.critical, icon: "error", color: "text-red-600", bg: "bg-red-600/5" },
          { label: "Resolved Today", value: stats.resolved, icon: "task_alt", color: "text-emerald-600", bg: "bg-emerald-600/5" },
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
              placeholder="Search student, incident or description..."
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
            <option value="open">Open Priority</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved Cycles</option>
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
            {filteredRows.length} <span className="text-slate-400">INCIDENTS</span>
          </span>
          <div className="h-6 w-px bg-slate-200" />
          {!pathname.includes("/parent") && (
            <Link
              href={pathname.includes("/teacher") ? "/teacher/behavior/create" : "/admin/behavior/create"}
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
            message={searchQuery ? "Try refining your search parameters." : "Start by recording your first behavioral incident or achievement."} 
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
                          row.status === "open" ? "warning" : "primary"
                        }
                        className="text-[8px] font-bold normal-case  px-2 py-0"
                      >
                        {row.status.replace("_", " ")}
                      </Badge>
                      <button 
                        onClick={() => handleDelete(row._id)}
                        className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                        title="Archive Record"
                      >
                        <span className="material-symbols-outlined text-[18px]">archive</span>
                      </button>
                    </div>
                  </div>

                  {/* Middle Row: Incident Detail (Pill Style) */}
                  <div className="mb-4 p-3 rounded-xl bg-slate-50/50 border border-slate-100/50 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-[8px] font-bold text-slate-400 normal-case  mb-1.5">Incident Context</p>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-700">
                        <span className={`px-1.5 py-0.5 rounded-md border ${
                          row.severity === 'critical' ? 'bg-red-50 text-red-600 border-red-100' : 
                          row.severity === 'major' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-white border-slate-100'
                        }`}>
                          {row.severity.toUpperCase()}
                        </span>
                        <span className="text-slate-300">/</span>
                        <span className="bg-white px-1.5 py-0.5 rounded-md border border-slate-100 truncate max-w-[100px]">
                          {row.incident_type.replace("_", " ")}
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
                       "{row.description || "No detailed description provided for this incident."}"
                     </p>
                  </div>

                  {/* Bottom Row: Notifications & Action */}
                  <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center ${row.parent_notified ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        <span className="material-symbols-outlined text-[14px]">{row.parent_notified ? 'notifications_active' : 'notifications_off'}</span>
                      </div>
                      <span className="text-[8px] font-bold text-slate-400 normal-case ">
                        {row.parent_notified ? 'Parent Notified' : 'Unnotified'}
                      </span>
                    </div>
                    <button 
                      onClick={() => alert(`Review: ${row.description}`)}
                      className="h-7 px-3 rounded-lg bg-slate-900 text-[9px] font-bold text-white normal-case  hover:bg-slate-800 transition-all flex items-center gap-1 shadow-md active:scale-95"
                    >
                        Review
                        <span className="material-symbols-outlined text-[14px]">visibility</span>
                    </button>
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
