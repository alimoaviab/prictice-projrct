import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useLeave } from "../hooks/useLeave";
import { LeaveRecordRow } from "../types/leave.types";
import { showToast } from "@/utils/toast";
import { DataTable, DataTableColumn, RowAction, Badge, DataState, TableSkeleton, Skeleton, StatCardGrid } from "@/components/ui";
import { useQueryParams } from "@/hooks/useQueryParams";

export default function LeaveListPage() {
  const pathname = useLocation().pathname;
  const { currentParams, updateQuery, withQuery } = useQueryParams();
  const { state, addLeave, updateLeave, deleteLeave, approveLeave, rejectLeave } = useLeave();
  
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(currentParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">((currentParams.get("status") as any) || "all");
  const [viewMode, setViewMode] = useState<"grid" | "list">((currentParams.get("view") as any) || "list");

  useEffect(() => {
    setSearchQuery(currentParams.get("search") || "");
    setStatusFilter((currentParams.get("status") as any) || "all");
    setViewMode((currentParams.get("view") as any) || "list");
  }, [currentParams.toString()]);

  const filteredRows = useMemo(() => {
    const rows = state.data || [];
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      const queryMatch =
        q.length === 0 ||
        row.requester_name.toLowerCase().includes(q) ||
        row.leave_type.toLowerCase().includes(q) ||
        (row.reason || "").toLowerCase().includes(q);
      const statusMatch = statusFilter === "all" ? true : row.status === statusFilter;
      return queryMatch && statusMatch;
    });
  }, [state.data, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const data = state.data || [];
    return {
      total: data.length,
      pending: data.filter(r => r.status === 'pending').length,
      approved: data.filter(r => r.status === 'approved').length,
      sickLeaves: data.filter(r => r.leave_type === 'sick').length,
    };
  }, [state.data]);

  const columns: DataTableColumn<LeaveRecordRow>[] = useMemo(() => [
    {
      key: "requester",
      label: "Requester",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold normal-case">
            {row.requester_name.substring(0, 1)}
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-none mb-1">{row.requester_name}</p>
            <p className="text-[10px] text-slate-400 font-bold normal-case tracking-tighter">
              {row.requester_type} {row.class_name ? `• ${row.class_name}` : ""}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      label: "Leave Category",
      render: (row) => (
        <Badge variant="secondary" className="normal-case text-[10px] font-bold  px-1.5 bg-slate-50 border-slate-100 text-slate-600">
          {row.leave_type.replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "dates",
      label: "Schedule",
      render: (row) => (
        <div className="flex flex-col">
          <p className="text-[11px] font-bold text-slate-700">{row.start_date}</p>
          <p className="text-[9px] font-bold text-slate-400 normal-case ">to {row.end_date}</p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Decision",
      render: (row) => (
        <Badge
          variant={
            row.status === "approved" ? "success" :
            row.status === "rejected" ? "error" :
            row.status === "pending" ? "warning" : "gray"
          }
          className="normal-case text-[9px] font-bold normal-case  px-2"
        >
          {row.status}
        </Badge>
      ),
    },
  ], []);

  const rowActions: RowAction<LeaveRecordRow>[] = useMemo(() => [
    {
      icon: "check_circle",
      label: "Approve",
      variant: "primary",
      showIf: (row: LeaveRecordRow) => row.status === "pending",
      onClick: (row: LeaveRecordRow) => approveLeave(row._id),
    },
    {
      icon: "cancel",
      label: "Reject",
      variant: "danger",
      showIf: (row: LeaveRecordRow) => row.status === "pending",
      onClick: (row: LeaveRecordRow) => setRejectingId(row._id),
    },
    {
       icon: "delete",
       label: "Archive",
       variant: "ghost",
       requireConfirm: true,
       onClick: (row: LeaveRecordRow) => deleteLeave(row._id),
    }
  ], [approveLeave, rejectLeave, deleteLeave]);

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      showToast("Please provide a rejection reason", "error");
      return;
    }
    await rejectLeave(id, rejectReason);
    setRejectingId(null);
    setRejectReason("");
  };

  if (state.status === "loading" && !state.data) {
    return <TableSkeleton />;
  }

  if (state.status === "error") {
    return <DataState variant="error" title="Error Loading Leave Requests" message={state.error} />;
  }

  return (
    <div className="space-y-6 relative min-h-[80vh] pb-10">
      {/* Stats Section */}
      <StatCardGrid
        items={[
          { label: "Total Requests", value: stats.total, icon: "event_available", accent: "blue" },
          { label: "Pending Review", value: stats.pending, icon: "hourglass_empty", accent: "amber" },
          { label: "Approved", value: stats.approved, icon: "verified", accent: "emerald" },
          { label: "Sick Leave", value: stats.sickLeaves, icon: "medical_services", accent: "rose" },
        ]}
      />

      {/* Toolbar Section - Unified & Sticky */}
      <div className="premium-card p-2 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/80 backdrop-blur-md border-slate-200/60 shadow-sm rounded-xl">
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
              placeholder="Search requester name, leave type or reason..."
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
            <option value="pending">Awaiting Review</option>
            <option value="approved">Approved Cycle</option>
            <option value="rejected">Rejected Records</option>
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
            {filteredRows.length} <span className="text-slate-400">REQUESTS</span>
          </span>
          <div className="h-6 w-px bg-slate-200" />
          <Link
            to={withQuery("/admin/leave/create")}
            className="inline-flex h-9 items-center gap-2 px-5 text-[11px] font-bold normal-case  text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            Submit Leave
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {filteredRows.length === 0 ? (
          <DataState 
            variant="empty" 
            title="No Leave Records Found" 
            message={searchQuery ? "Try refining your search parameters." : "Start by submitting your first leave request or review pending ones."} 
          />
        ) : (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRows.map((row) => (
                <div key={row._id} className="premium-card group relative flex flex-col p-0 overflow-hidden transition-all duration-500 bg-white border-slate-200/60 hover:shadow-2xl hover:shadow-slate-200/80 hover:-translate-y-1">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold normal-case shadow-lg group-hover:scale-110 transition-transform">
                        {row.requester_name.substring(0, 1)}
                      </div>
                      <Badge
                        variant={
                          row.status === "approved" ? "success" :
                          row.status === "rejected" ? "error" : "warning"
                        }
                        className="normal-case text-[9px] font-bold  px-2 py-0.5"
                      >
                        {row.status}
                      </Badge>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors truncate">{row.requester_name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 normal-case  mt-1 normal-case">
                        {row.class_name || row.requester_type} &bull; {row.leave_type}
                      </p>
                    </div>

                    <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100/50 mb-6">
                      <p className="text-[8px] font-bold text-slate-400 normal-case  mb-1">Time Period</p>
                      <p className="text-[11px] font-bold text-slate-700 truncate">{row.start_date} <span className="text-slate-400 font-normal">to</span> {row.end_date}</p>
                    </div>

                    <div className="space-y-1 min-h-[40px]">
                       <p className="text-[9px] font-bold text-slate-400 normal-case ">Reason / Note</p>
                       <p className="text-[11px] text-slate-600 line-clamp-2 italic">"{row.reason || "No reason specified"}"</p>
                    </div>
                  </div>
                  
                  <div className="mt-auto px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between group-hover:bg-white transition-all">
                     {row.status === 'pending' ? (
                        <>
                           <button 
                             onClick={() => approveLeave(row._id)}
                             className="text-[10px] font-bold text-emerald-600 normal-case  hover:text-emerald-700 flex items-center gap-1"
                           >
                              <span className="material-symbols-outlined text-sm">check_circle</span>
                              Approve
                           </button>
                           <button 
                             onClick={() => setRejectingId(row._id)}
                             className="text-[10px] font-bold text-red-400 normal-case  hover:text-red-500 flex items-center gap-1"
                           >
                              <span className="material-symbols-outlined text-sm">cancel</span>
                              Reject
                           </button>
                        </>
                     ) : (
                        <div className="flex items-center gap-2 text-slate-400">
                           <span className="material-symbols-outlined text-sm">history</span>
                           <span className="text-[9px] font-bold normal-case ">Decision Finalized</span>
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
                rowActions={rowActions}
              />
            </div>
          )
        )}
      </div>

      {/* Pagination Footer - Premium ERP Style */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 normal-case ">
          Showing <span className="text-blue-600">1</span> to <span className="text-slate-900">{filteredRows.length}</span> of <span className="text-slate-900">{state.data?.length}</span> Leave Records
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

      {/* Rejection Modal - Standardized Premium Style */}
      {rejectingId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Reject Leave Request</h3>
              <p className="text-[11px] font-bold text-slate-400 normal-case  mt-1">Official justification required</p>
            </div>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 mb-6 text-sm font-medium text-slate-700 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-600/5 placeholder:text-slate-300 min-h-[120px]"
              placeholder="Why is this request being declined?"
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setRejectingId(null)} 
                className="h-10 px-6 rounded-xl border border-slate-200 text-[11px] font-bold normal-case  text-slate-400 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleReject(rejectingId)} 
                className="h-10 px-8 bg-red-600 text-white rounded-xl text-[11px] font-bold normal-case  hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
