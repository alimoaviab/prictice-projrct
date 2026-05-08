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
      render: (row) => <span className="capitalize">{row.incident_type.replace("_", " ")}</span>,
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
            row.status === "resolved" ? "success" :
              row.status === "open" ? "warning" :
                row.status === "under_review" ? "primary" :
                  "error"
          }
          className="capitalize"
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
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-xl font-black text-slate-900 tracking-tighter leading-none">{stat.value}</h3>
            </div>
            <div className={`h-8 w-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
               <span className="material-symbols-outlined text-lg font-black">{stat.icon}</span>
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
          <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest px-2 whitespace-nowrap">
            {filteredRows.length} <span className="text-slate-400">INCIDENTS</span>
          </span>
          <div className="h-6 w-px bg-slate-200" />
          {!pathname.includes("/parent") && (
            <Link
              href={pathname.includes("/teacher") ? "/teacher/behavior/create" : "/admin/behavior/create"}
              className="inline-flex h-9 items-center gap-2 px-5 text-[11px] font-black uppercase tracking-widest text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRows.map((row) => (
                <div key={row._id} className="premium-card group relative flex flex-col p-0 overflow-hidden transition-all duration-500 bg-white border-slate-200/60 hover:shadow-2xl hover:shadow-slate-200/80 hover:-translate-y-1">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${
                        row.severity === 'critical' ? 'bg-red-50 text-red-600' : 
                        row.severity === 'major' ? 'bg-amber-50 text-amber-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        <span className="material-symbols-outlined font-black">
                          {row.severity === 'critical' ? 'warning' : 'report_problem'}
                        </span>
                      </div>
                      <Badge
                        variant={
                          row.status === "resolved" ? "success" :
                          row.status === "open" ? "warning" : "primary"
                        }
                        className="uppercase text-[9px] font-black tracking-widest px-2 py-0.5"
                      >
                        {row.status.replace("_", " ")}
                      </Badge>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors truncate">{row.student_name}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{row.class_name}</p>
                    </div>

                    <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100/50 mb-6 min-h-[60px]">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Incident Type</p>
                      <p className="text-[11px] font-bold text-slate-700 capitalize mb-2">{row.incident_type.replace("_", " ")}</p>
                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{row.description || "No description provided."}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                       <div className="flex items-center gap-2 text-slate-400">
                          <span className="material-symbols-outlined text-[16px]">notification_important</span>
                          <span className="text-[9px] font-black uppercase tracking-widest">
                            Warnings: <span className="text-slate-900">{row.warning_count}</span>
                          </span>
                       </div>
                       <Badge variant={row.parent_notified ? "success" : "gray"} className="text-[8px] font-black uppercase tracking-widest px-1.5">
                          {row.parent_notified ? "Parent Notified" : "Awaiting Notification"}
                       </Badge>
                    </div>
                  </div>
                  
                  <div className="mt-auto px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between group-hover:bg-white transition-all">
                     <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        Review
                     </button>
                     <button 
                        onClick={() => handleDelete(row._id)}
                        className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        Archive
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
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Showing <span className="text-blue-600">1</span> to <span className="text-slate-900">{filteredRows.length}</span> of <span className="text-slate-900">{state.data?.length}</span> Incident Records
        </p>
        <div className="flex items-center gap-2">
          <button className="h-9 px-4 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-not-allowed flex items-center gap-2">
            <span className="material-symbols-outlined text-base">chevron_left</span>
            Previous
          </button>
          <div className="flex items-center gap-1">
            <button className="h-9 w-9 rounded-xl bg-blue-600 text-[10px] font-black text-white shadow-lg shadow-blue-600/20">1</button>
          </div>
          <button className="h-9 px-4 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-not-allowed flex items-center gap-2">
            Next
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
