import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { DataTable, DataTableColumn, RowAction, Badge, DataState, Skeleton, TableSkeleton, StatCardGrid } from "@/components/ui";
import { useAnnouncements } from "../hooks/useAnnouncements";
import { AnnouncementRecordRow } from "../types/announcement.types";
import { showToast } from "@/utils/toast";
import { useQueryParams } from "@/hooks/useQueryParams";

export function AnnouncementListPage() {
  const pathname = useLocation().pathname;
  const { currentParams, updateQuery, withQuery } = useQueryParams();
  const { state, updateAnnouncement, deleteAnnouncement } = useAnnouncements();
  const [searchQuery, setSearchQuery] = useState(currentParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "archived">((currentParams.get("status") as any) || "all");
  const [viewMode, setViewMode] = useState<"grid" | "list">((currentParams.get("view") as any) || "list");

  useEffect(() => {
    setSearchQuery(currentParams.get("search") || "");
    setStatusFilter((currentParams.get("status") as any) || "all");
    setViewMode((currentParams.get("view") as any) || "list");
  }, [currentParams.toString()]);

  const isValidObjectId = (value?: string) => typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value);

  const filteredRows = useMemo(() => {
    const rows = state.data || [];
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      const queryMatch =
        q.length === 0 ||
        row.title.toLowerCase().includes(q) ||
        (row.content || "").toLowerCase().includes(q) ||
        row.target_type.toLowerCase().includes(q);
      const statusMatch = statusFilter === "all" ? true : row.status === statusFilter;
      return queryMatch && statusMatch;
    });
  }, [state.data, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const data = state.data || [];
    return {
      total: data.length,
      published: data.filter(r => r.status === 'published').length,
      urgent: data.filter(r => r.priority === 'urgent' || r.priority === 'high').length,
      reach: "82%",
    };
  }, [state.data]);

  const columns: DataTableColumn<AnnouncementRecordRow>[] = useMemo(() => [
    {
      key: "priority",
      label: "Priority",
      render: (row) => (
        <Badge
          variant={
            row.priority === "urgent" ? "error" :
            row.priority === "high" ? "warning" :
            row.priority === "normal" ? "secondary" : "gray"
          }
          className="normal-case text-[9px] font-bold normal-case  px-2"
        >
          {row.priority}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: "title",
      label: "Notice / Message",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 leading-none mb-1">{row.title}</span>
          <span className="text-[10px] text-slate-400 font-bold normal-case tracking-tighter truncate max-w-[200px]">{row.content}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "target",
      label: "Reach",
      render: (row) => (
        <Badge variant="gray" className="normal-case text-[10px] font-bold  px-1.5 bg-slate-50 border-slate-100 text-slate-500">
           {row.target_type}
        </Badge>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge
          variant={row.status === "published" ? "success" : row.status === "draft" ? "warning" : "gray"}
          className="normal-case text-[9px] font-bold normal-case  px-2"
        >
          {row.status}
        </Badge>
      ),
      sortable: true,
    },
  ], []);

  const rowActions: RowAction<AnnouncementRecordRow>[] = useMemo(() => [
    {
      icon: "visibility",
      label: "View Broadcast",
      variant: "primary",
      onClick: (row) => alert(`Notice: ${row.title}`),
    },
    {
      icon: "edit",
      label: "Edit Publish",
      variant: "ghost",
      onClick: async (row) => {
        if (!isValidObjectId(row._id)) return;
        const status = window.prompt("Status (draft/published/archived)", row.status)?.trim();
        if (status) await updateAnnouncement(row._id, { status: status as any });
      },
    },
    {
      icon: "delete",
      label: "Remove",
      variant: "danger",
      requireConfirm: true,
      onClick: async (row) => {
        if (isValidObjectId(row._id)) await deleteAnnouncement(row._id);
      },
    },
  ], []);

  if (state.status === "loading" && !state.data) {
    return <TableSkeleton />;
  }

  if (state.status === "error") {
    return <DataState variant="error" title="Failed to load announcements" message={state.error} />;
  }

  return (
    <div className="space-y-8 relative min-h-[80vh] pb-10">
      {/* Stats Section - Premium & Compact */}
      <StatCardGrid
        items={[
          { label: "Total Notices", value: stats.total, icon: "campaign", accent: "blue" },
          { label: "Live Now", value: stats.published, icon: "podcasts", accent: "emerald" },
          { label: "Critical Alerts", value: stats.urgent, icon: "emergency_home", accent: "rose" },
          { label: "Reach Index", value: stats.reach, icon: "cell_tower", accent: "purple" },
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
              placeholder="Search notices, content or target audience..."
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
            <option value="all">Lifecycle: All</option>
            <option value="published">Active Broadcasts</option>
            <option value="draft">Draft Collection</option>
            <option value="archived">Archived Notices</option>
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
            {filteredRows.length} <span className="text-slate-400">NOTICES</span>
          </span>
          <div className="h-6 w-px bg-slate-200" />
          <Link
            to={withQuery(pathname.includes("/teacher") ? "/teacher/announcements/create" : "/admin/announcements/create")}
            className="inline-flex h-9 items-center gap-2 px-5 text-[11px] font-bold normal-case  text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">campaign</span>
            New Notice
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {filteredRows.length === 0 ? (
          <DataState 
            variant="empty" 
            title="No Broadcasts Found" 
            message={searchQuery ? "Try refining your search parameters." : "Start by creating your first institutional announcement."} 
          />
        ) : (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRows.map((row) => (
                <div key={row._id} className="premium-card group relative flex flex-col p-0 overflow-hidden transition-all duration-500 bg-white border-slate-200/60 hover:shadow-2xl hover:shadow-slate-200/80 hover:-translate-y-1">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold normal-case shadow-lg group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-lg">campaign</span>
                      </div>
                      <Badge
                        variant={row.priority === "urgent" ? "error" : row.priority === "high" ? "warning" : "secondary"}
                        className="normal-case text-[9px] font-bold  px-2 py-0.5"
                      >
                        {row.priority}
                      </Badge>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors truncate">{row.title}</h3>
                      <p className="text-[10px] font-bold text-slate-400 normal-case  mt-1">Target: {row.target_type} &bull; {row.status}</p>
                    </div>

                    <div className="space-y-1 min-h-[60px]">
                       <p className="text-[11px] text-slate-600 line-clamp-3">"{row.content || "No detailed content provided."}"</p>
                    </div>
                  </div>
                  
                  <div className="mt-auto px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between group-hover:bg-white transition-all">
                     <div className="flex items-center gap-2 text-slate-400">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        <span className="text-[9px] font-bold normal-case ">
                          {row.created_at ? new Date(row.created_at).toLocaleDateString() : "Pending"}
                        </span>
                     </div>
                     <div className="flex items-center gap-1">
                        <button onClick={() => alert(`Broadcast Details: ${row.title}`)} className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:text-blue-600 transition-all">
                           <span className="material-symbols-outlined text-lg">visibility</span>
                        </button>
                        <button onClick={() => deleteAnnouncement(row._id)} className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:text-red-500 transition-all">
                           <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="premium-card overflow-hidden border-slate-200/60 shadow-sm bg-white rounded-2xl">
              <DataTable
                columns={columns}
                rows={filteredRows}
                rowKey={(row, index) => (isValidObjectId(row._id) ? row._id : `${row.title}-${index}`)}
                sortable
                paginated={10}
                rowActions={rowActions}
              />
            </div>
          )
        )}
      </div>

      {/* Pagination Footer - Premium ERP Style */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 normal-case ">
          Showing <span className="text-blue-600">1</span> to <span className="text-slate-900">{filteredRows.length}</span> of <span className="text-slate-900">{state.data?.length}</span> Broadcast Records
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
