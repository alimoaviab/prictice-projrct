import { AppIcon } from "shared/ui/AppIcon";
import { useMemo, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEvents } from "../hooks/useEvents";
import { EventRecordRow } from "../types/events.types";
import { DataTable, DataTableColumn, RowAction, Badge, DataState, TableSkeleton, StatCardGrid } from "@/components/ui";
import type { EventListFilters } from "../services/events.service";

export default function EventListPage({ filters }: { filters?: EventListFilters } = {}) {
  const pathname = useLocation().pathname;
  const isParent = pathname.includes("/parent");
  const navigate = useNavigate();
  const { state, deleteEvent } = useEvents(filters);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "scheduled" | "cancelled" | "completed">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const editPath = (id: string) =>
    pathname.includes("/teacher") ? `/teacher/events/${id}/edit` : `/admin/events/${id}/edit`;
  const createPath = pathname.includes("/teacher") ? "/teacher/events/create" : "/admin/events/create";

  const filteredRows = useMemo(() => {
    const rows = state.data || [];
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      const queryMatch =
        q.length === 0 ||
        row.title.toLowerCase().includes(q) ||
        (row.location || "").toLowerCase().includes(q) ||
        row.event_type.toLowerCase().includes(q);
      const statusMatch = statusFilter === "all" ? true : row.status === statusFilter;
      return queryMatch && statusMatch;
    });
  }, [state.data, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const data = state.data || [];
    return {
      total: data.length,
      upcoming: data.filter(r => new Date(r.start_date) > new Date()).length,
      academic: data.filter(r => r.event_type === 'academic').length,
      participation: "92%",
    };
  }, [state.data]);

  const columns: DataTableColumn<EventRecordRow>[] = useMemo(() => [
    {
      key: "title",
      label: "Event Milestone",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <AppIcon name="Calendar" size={18} className="font-black" />
          </div>
          <div>
            <p className="font-black text-slate-900 leading-none mb-1 tracking-tight">{row.title}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{row.location || "Global Campus"}</p>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "type",
      label: "Category",
      render: (row) => (
        <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest px-2 bg-slate-50 text-slate-500 border-slate-100">
           {row.event_type}
        </Badge>
      ),
    },
    {
      key: "dates",
      label: "Schedule",
      render: (row) => (
        <div className="flex flex-col">
          <p className="text-[11px] font-black text-slate-700">{row.start_date}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase">to {row.end_date || "TBD"}</p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge
          variant={row.status === "scheduled" ? "warning" : row.status === "completed" ? "success" : "error"}
          className="text-[9px] font-black uppercase tracking-widest px-2"
        >
          {row.status}
        </Badge>
      ),
    },
  ], []);

  const rowActions: RowAction<EventRecordRow>[] = useMemo(() => {
    if (isParent) return [];
    return [
        {
          icon: "edit",
          label: "Modify",
          variant: "ghost",
          onClick: (row) => {
            navigate(editPath(row._id));
          },
        },
        {
          icon: "delete",
          label: "Cancel",
          variant: "danger",
          requireConfirm: true,
          onClick: (row) => deleteEvent(row._id),
        },
      ];
  }, [isParent, deleteEvent, pathname]);

  if (state.status === "loading" && !state.data) {
    return <TableSkeleton />;
  }

  if (state.status === "error") {
    return <DataState variant="error" title="Calendar Error" message={state.error} />;
  }

  return (
    <div className="space-y-6 relative pb-10">
      {/* Stats Section */}
      <StatCardGrid
        items={[
          { label: "Total Events", value: stats.total, icon: "event", accent: "blue" },
          { label: "Upcoming", value: stats.upcoming, icon: "upcoming", accent: "purple" },
          { label: "Academic", value: stats.academic, icon: "school", accent: "emerald" },
          { label: "This Month", value: stats.participation, icon: "calendar_month", accent: "amber" },
        ]}
      />

      {/* Toolbar */}
      <div className="p-2 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-slate-100 shadow-sm rounded-xl">
        <div className="flex flex-1 items-center gap-2 max-w-2xl">
          <div className="relative flex-1">
            <AppIcon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search event title, location..."
              className="h-9 w-full rounded-lg border border-slate-50 bg-slate-50/50 pl-10 pr-3 text-[11px] font-bold text-slate-700 outline-none transition-all focus:border-blue-400 focus:bg-white placeholder:text-slate-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-9 rounded-lg border border-slate-50 bg-slate-50/50 px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer"
          >
            <option value="all">Status: All</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg bg-slate-50 p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex h-7 items-center gap-2 rounded-md px-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <AppIcon name="LayoutGrid" size={16} />
              Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex h-7 items-center gap-2 rounded-md px-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <AppIcon name="ViewList" size={16} />
              List
            </button>
          </div>

          {!isParent && (
            <Link
              to={createPath}
              className="h-9 inline-flex items-center gap-2 px-5 text-[10px] font-black uppercase tracking-widest text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-600/10 active:scale-95"
            >
              <AppIcon name="Plus" size={16} />
              Add Event
            </Link>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {filteredRows.length === 0 ? (
          <DataState 
            variant="empty" 
            title="No Events Found" 
            message={searchQuery ? "Try refining your search terms." : "The school calendar is currently empty."} 
          />
        ) : (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRows.map((row) => (
                <div key={row._id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:border-blue-200 transition-all group flex flex-col">
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <AppIcon name="Calendar" className="font-black" />
                      </div>
                      <Badge
                        variant={row.status === "scheduled" ? "warning" : row.status === "completed" ? "success" : "error"}
                        className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5"
                      >
                        {row.status}
                      </Badge>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-[15px] font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors truncate">{row.title}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{row.event_type} &bull; {row.location || "Global Campus"}</p>
                    </div>

                    <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100/50">
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Timing Index</p>
                      <p className="text-[11px] font-black text-slate-700 truncate">{row.start_date} <span className="text-slate-400 font-normal">to</span> {row.end_date || "TBD"}</p>
                    </div>
                  </div>
                  
                  <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                     <div className="flex items-center gap-2 text-slate-400">
                        <AppIcon name="MapPin" size={14} />
                        <span className="text-[9px] font-black uppercase tracking-tighter truncate max-w-[120px]">{row.location || "Global"}</span>
                     </div>
                     {!isParent && (
                        <div className="flex items-center gap-1">
                          <Link to={editPath(row._id)} className="h-7 w-7 flex items-center justify-center rounded text-slate-300 hover:text-blue-600 transition-all">
                             <AppIcon name="SquarePen" size={18} />
                          </Link>
                          <button onClick={() => deleteEvent(row._id)} className="h-7 w-7 flex items-center justify-center rounded text-slate-300 hover:text-rose-600 transition-all">
                             <AppIcon name="Trash2" size={18} />
                          </button>
                        </div>
                     )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <DataTable
                columns={columns}
                rows={filteredRows}
                rowKey={(row) => row._id}
                sortable
                paginated={10}
                rowActions={rowActions}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}
