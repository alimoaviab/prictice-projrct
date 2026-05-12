"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useEvents } from "../hooks/useEvents";
import { EventRecordRow, EventFormInput } from "../types/events.types";
import EventForm from "./EventForm";
import { DataTable, DataTableColumn, RowAction, Badge, DataState, Skeleton, TableSkeleton } from "../../../components/ui";

export default function EventListPage() {
  const pathname = usePathname();
  const { state, addEvent, updateEvent, deleteEvent } = useEvents();
  
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EventRecordRow | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "scheduled" | "cancelled" | "completed">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
          <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold normal-case">
            <span className="material-symbols-outlined text-base">event</span>
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-none mb-1">{row.title}</p>
            <p className="text-[10px] text-slate-400 font-bold normal-case tracking-tighter normal-case">{row.location || "Global Campus"}</p>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "type",
      label: "Category",
      render: (row) => (
        <Badge variant="secondary" className="normal-case text-[10px] font-bold  px-1.5 bg-slate-50 border-slate-100 text-slate-600">
           {row.event_type}
        </Badge>
      ),
    },
    {
      key: "dates",
      label: "Schedule",
      render: (row) => (
        <div className="flex flex-col">
          <p className="text-[11px] font-bold text-slate-700">{row.start_date}</p>
          <p className="text-[9px] font-bold text-slate-400 normal-case ">to {row.end_date || "N/A"}</p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge
          variant={row.status === "scheduled" ? "warning" : row.status === "completed" ? "success" : "error"}
          className="normal-case text-[9px] font-bold normal-case  px-2"
        >
          {row.status}
        </Badge>
      ),
    },
  ], []);

  const rowActions: RowAction<EventRecordRow>[] = useMemo(() => [
    {
      icon: "edit",
      label: "Modify",
      variant: "ghost",
      onClick: (row) => {
        setEditing(row);
        setShowForm(true);
      },
    },
    {
      icon: "delete",
      label: "Cancel Event",
      variant: "danger",
      requireConfirm: true,
      onClick: (row) => deleteEvent(row._id),
    },
  ], []);

  const handleSubmit = async (data: EventFormInput) => {
    if (editing) {
      await updateEvent(editing._id, data);
    } else {
      await addEvent(data);
    }
    setShowForm(false);
    setEditing(null);
  };

  if (state.status === "loading" && !state.data) {
    return <TableSkeleton />;
  }

  if (state.status === "error") {
    return <DataState variant="error" title="Event Directory Error" message={state.error} />;
  }

  return (
    <div className="space-y-8 relative min-h-[80vh] pb-10">
      {/* Stats Section - Premium & Compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Institutional Events", value: stats.total, icon: "celebration", color: "text-blue-600", bg: "bg-blue-600/5" },
          { label: "Upcoming Cycle", value: stats.upcoming, icon: "upcoming", color: "text-emerald-600", bg: "bg-emerald-600/5" },
          { label: "Academic Focus", value: stats.academic, icon: "school", color: "text-amber-600", bg: "bg-amber-600/5" },
          { label: "Participation Rate", value: stats.participation, icon: "groups", color: "text-purple-600", bg: "bg-purple-600/5" },
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

      {/* Form Overlay - Premium Integration */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
           <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-100 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
             <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">{editing ? "Modify Event Milestone" : "Schedule New Milestone"}</h3>
                  <p className="text-[11px] font-bold text-slate-400 normal-case  mt-1">Institutional Calendar Management</p>
                </div>
                <button onClick={() => { setShowForm(false); setEditing(null); }} className="h-8 w-8 rounded-full hover:bg-slate-50 flex items-center justify-center transition-colors">
                   <span className="material-symbols-outlined text-slate-400">close</span>
                </button>
             </div>
             <EventForm
               initial={editing ?? undefined}
               onSubmit={handleSubmit}
               onCancel={() => { setShowForm(false); setEditing(null); }}
             />
           </div>
        </div>
      )}

      {/* Toolbar Section - Unified & Sticky */}
      <div className="premium-card p-2 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/80 backdrop-blur-md sticky top-[72px] z-20 border-slate-200/60 shadow-sm rounded-xl">
        <div className="flex flex-1 items-center gap-2 max-w-2xl">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">search</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search event title, location or category..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs font-medium text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-600/5 placeholder:text-slate-400"
            />
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none cursor-pointer transition-all hover:border-slate-300 focus:border-blue-400"
          >
            <option value="all">Status: All</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
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
            {filteredRows.length} <span className="text-slate-400">EVENTS</span>
          </span>
          <div className="h-6 w-px bg-slate-200" />
          {!pathname.includes("/parent") && (
            <button
              onClick={() => { setEditing(null); setShowForm(true); }}
              className="inline-flex h-9 items-center gap-2 px-5 text-[11px] font-bold normal-case  text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">event_available</span>
              Add Event
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {filteredRows.length === 0 ? (
          <DataState 
            variant="empty" 
            title="No Institutional Events Found" 
            message={searchQuery ? "Try refining your search parameters." : "Start by scheduling your first school event or institutional milestone."} 
          />
        ) : (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRows.map((row) => (
                <div key={row._id} className="premium-card group relative flex flex-col p-0 overflow-hidden transition-all duration-500 bg-white border-slate-200/60 hover:shadow-2xl hover:shadow-slate-200/80 hover:-translate-y-1">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold normal-case shadow-lg group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-lg">event</span>
                      </div>
                      <Badge
                        variant={row.status === "scheduled" ? "warning" : row.status === "completed" ? "success" : "error"}
                        className="normal-case text-[9px] font-bold  px-2 py-0.5"
                      >
                        {row.status}
                      </Badge>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors truncate">{row.title}</h3>
                      <p className="text-[10px] font-bold text-slate-400 normal-case  mt-1 normal-case">{row.event_type} &bull; {row.location || "Global Campus"}</p>
                    </div>

                    <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100/50 mb-6">
                      <p className="text-[8px] font-bold text-slate-400 normal-case  mb-1">Timing Index</p>
                      <p className="text-[11px] font-bold text-slate-700 truncate">{row.start_date} <span className="text-slate-400 font-normal">to</span> {row.end_date || "—"}</p>
                    </div>
                  </div>
                  
                  <div className="mt-auto px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between group-hover:bg-white transition-all">
                     <div className="flex items-center gap-2 text-slate-400">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        <span className="text-[9px] font-bold normal-case  truncate max-w-[120px]">{row.location || "Global"}</span>
                     </div>
                     {!pathname.includes("/parent") && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditing(row); setShowForm(true); }} className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:text-blue-600 transition-all">
                             <span className="material-symbols-outlined text-lg">edit_square</span>
                          </button>
                          <button onClick={() => deleteEvent(row._id)} className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:text-red-500 transition-all">
                             <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
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
                rowActions={pathname.includes("/parent") ? [] : rowActions}
              />
            </div>
          )
        )}
      </div>

      {/* Pagination Footer - Premium ERP Style */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 normal-case ">
          Showing <span className="text-blue-600">1</span> to <span className="text-slate-900">{filteredRows.length}</span> of <span className="text-slate-900">{state.data?.length}</span> Calendar Records
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
