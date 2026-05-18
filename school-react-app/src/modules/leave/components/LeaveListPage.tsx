/**
 * Admin Leave list — review-only.
 *
 * Why no "Submit Leave" CTA here: leave requests originate from the
 * student/teacher portals. Admin's role is reviewer (approve / reject /
 * delete / inspect). Manual create from admin would create fake records
 * with no real requester intent and confuse the audit trail. Removed.
 *
 * Filters supported (all server-side via /api/leave query params):
 *   - status: pending | approved | rejected | cancelled | all
 *   - requester_type: student | teacher | all
 *   - start_date / end_date  (start_date >= filter.start AND start_date <= filter.end)
 *   - search (client-side, against name/type/reason)
 *
 * Stats are derived from the currently-loaded list — same dataset the
 * admin sees, so the numbers always reconcile with what's on screen.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DataTable,
  DataTableColumn,
  RowAction,
  Badge,
  DataState,
  TableSkeleton,
  StatCardGrid,
  Button,
  PageHeader,
} from "@/components/ui";
import { useLeave } from "../hooks/useLeave";
import { LeaveRecordRow, LeaveFormInput } from "../types/leave.types";
import { showToast } from "@/utils/toast";
import { useQueryParams } from "@/hooks/useQueryParams";
import { motion, AnimatePresence } from "framer-motion";
import { StudentLeaveSubmitForm } from "./StudentLeaveSubmitForm";

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "cancelled";
type TypeFilter = "all" | "student" | "teacher";

export default function LeaveListPage() {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const { currentParams, updateQuery } = useQueryParams();
  const { state, deleteLeave, approveLeave, rejectLeave, addLeave } = useLeave();

  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(currentParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    (currentParams.get("status") as StatusFilter) || "all"
  );
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(
    (currentParams.get("requester_type") as TypeFilter) || "all"
  );
  const [startDate, setStartDate] = useState(currentParams.get("start_date") || "");
  const [endDate, setEndDate] = useState(currentParams.get("end_date") || "");
  const [viewMode, setViewMode] = useState<"grid" | "list">(
    (currentParams.get("view") as any) || "list"
  );

  const isTeacher = pathname.startsWith("/teacher");

  useEffect(() => {
    setSearchQuery(currentParams.get("search") || "");
    setStatusFilter((currentParams.get("status") as StatusFilter) || "all");
    setTypeFilter((currentParams.get("requester_type") as TypeFilter) || "all");
    setStartDate(currentParams.get("start_date") || "");
    setEndDate(currentParams.get("end_date") || "");
    setViewMode((currentParams.get("view") as any) || "list");
  }, [currentParams.toString()]);

  const isAdmin = pathname.startsWith("/admin");
  const detailBase = isAdmin ? "/admin/leave" : "/teacher/leave";

  const filteredRows = useMemo(() => {
    const rows = state.data || [];
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      const queryMatch =
        q.length === 0 ||
        row.requester_name.toLowerCase().includes(q) ||
        row.leave_type.toLowerCase().includes(q) ||
        (row.reason || "").toLowerCase().includes(q);
      const statusMatch = statusFilter === "all" || row.status === statusFilter;
      const typeMatch = typeFilter === "all" || row.requester_type === typeFilter;
      const startMatch = !startDate || row.start_date >= startDate;
      const endMatch = !endDate || row.start_date <= endDate;
      return queryMatch && statusMatch && typeMatch && startMatch && endMatch;
    });
  }, [state.data, searchQuery, statusFilter, typeFilter, startDate, endDate]);

  // Stats are calculated from the full unfiltered list so the cards
  // always represent the school's true volume, not the user's filter.
  const stats = useMemo(() => {
    const data = state.data || [];
    return {
      total: data.length,
      pending: data.filter((r) => r.status === "pending").length,
      approved: data.filter((r) => r.status === "approved").length,
      sickLeaves: data.filter((r) => r.leave_type === "sick").length,
    };
  }, [state.data]);

  const columns: DataTableColumn<LeaveRecordRow>[] = useMemo(
    () => [
      {
        key: "requester",
        label: "Requester",
        render: (row) => (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold">
              {row.requester_name.substring(0, 1)}
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-none mb-1">
                {row.requester_name}
              </p>
              <p className="text-[10px] text-slate-400 font-bold normal-case tracking-tighter capitalize">
                {row.requester_type}
                {row.class_name ? ` • ${row.class_name}` : ""}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "type",
        label: "Leave Category",
        render: (row) => (
          <Badge
            variant="secondary"
            className="capitalize text-[10px] font-bold px-1.5 bg-slate-50 border-slate-100 text-slate-600"
          >
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
            <p className="text-[9px] font-bold text-slate-400 normal-case">to {row.end_date}</p>
          </div>
        ),
      },
      {
        key: "status",
        label: "Decision",
        render: (row) => (
          <Badge
            variant={
              row.status === "approved"
                ? "success"
                : row.status === "rejected"
                  ? "error"
                  : row.status === "pending"
                    ? "warning"
                    : "gray"
            }
            className="capitalize text-[9px] font-bold px-2"
          >
            {row.status}
          </Badge>
        ),
      },
    ],
    []
  );

  const rowActions: RowAction<LeaveRecordRow>[] = useMemo(
    () => [
      {
        icon: "visibility",
        label: "View",
        variant: "ghost",
        onClick: (row) => navigate(`${detailBase}/${row._id}`),
      },
      {
        icon: "check_circle",
        label: "Approve",
        variant: "primary",
        showIf: (row: LeaveRecordRow) => row.status === "pending",
        onClick: (row) => approveLeave(row._id),
      },
      {
        icon: "cancel",
        label: "Reject",
        variant: "danger",
        showIf: (row: LeaveRecordRow) => row.status === "pending",
        onClick: (row) => setRejectingId(row._id),
      },
      {
        icon: "delete",
        label: "Archive",
        variant: "ghost",
        requireConfirm: true,
        // Only allow delete for already-decided requests; pending ones
        // need an explicit approve/reject path so the audit trail
        // captures the admin's decision.
        showIf: (row: LeaveRecordRow) => row.status !== "pending",
        onClick: (row) => deleteLeave(row._id),
      },
    ],
    [approveLeave, deleteLeave, navigate, detailBase]
  );

  async function handleReject(id: string) {
    if (!rejectReason.trim()) {
      showToast("Please provide a rejection reason", "error");
      return;
    }
    await rejectLeave(id, rejectReason);
    setRejectingId(null);
    setRejectReason("");
  }

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
    setStartDate("");
    setEndDate("");
    updateQuery({
      search: "",
      status: "all",
      requester_type: "all",
      start_date: "",
      end_date: "",
    });
  }

  async function handleSubmitLeave(data: LeaveFormInput) {
    const res = await addLeave(data);
    if ((res as any).ok) {
      setIsSubmitModalOpen(false);
    }
  }

  const hasActiveFilters =
    searchQuery || statusFilter !== "all" || typeFilter !== "all" || startDate || endDate;

  if (state.status === "loading" && !state.data) {
    return <TableSkeleton />;
  }

  if (state.status === "error") {
    return (
      <DataState variant="error" title="Error Loading Leave Requests" message={state.error} />
    );
  }

  return (
    <div className="space-y-6 relative min-h-[80vh] pb-10">
      {isTeacher && (
        <PageHeader
          title="Leave Requests"
          description="Manage your leave requests and student leave requests for your assigned classes."
          actions={
            <Button onClick={() => setIsSubmitModalOpen(true)}>
              <span className="material-symbols-outlined text-lg mr-2">add</span>
              Submit leave
            </Button>
          }
        />
      )}
      <StatCardGrid
        items={[
          {
            label: "Total Requests",
            value: stats.total,
            icon: "event_available",
            accent: "blue",
          },
          {
            label: "Pending Review",
            value: stats.pending,
            icon: "hourglass_empty",
            accent: "amber",
          },
          { label: "Approved", value: stats.approved, icon: "verified", accent: "emerald" },
          {
            label: "Sick Leave",
            value: stats.sickLeaves,
            icon: "medical_services",
            accent: "rose",
          },
        ]}
      />

      <div className="bg-white border border-slate-200 ring-1 ring-slate-900/5 rounded-xl shadow-[0_4px_18px_rgb(0,0,0,0.03)] px-3 py-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-1 items-center flex-wrap gap-2">
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
                placeholder="Search requester, type or reason…"
                className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[12px] font-medium text-slate-700 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 placeholder:text-slate-400"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                const value = e.target.value as StatusFilter;
                setStatusFilter(value);
                updateQuery({ status: value });
              }}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-600 outline-none cursor-pointer hover:border-slate-300"
            >
              <option value="all">Status: All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
                const value = e.target.value as TypeFilter;
                setTypeFilter(value);
                updateQuery({ requester_type: value });
              }}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-600 outline-none cursor-pointer hover:border-slate-300"
            >
              <option value="all">Role: All</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
            </select>

            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                updateQuery({ start_date: e.target.value });
              }}
              aria-label="From date"
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-600 outline-none cursor-pointer hover:border-slate-300"
            />
            <span className="text-[10px] font-bold text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                updateQuery({ end_date: e.target.value });
              }}
              aria-label="To date"
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-600 outline-none cursor-pointer hover:border-slate-300"
            />

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
              <span className="text-slate-400"> requests</span>
            </span>
          </div>
        </div>
      </div>

      <div>
        {filteredRows.length === 0 ? (
          <DataState
            variant="empty"
            title="No leave requests"
            message={
              hasActiveFilters
                ? "Try adjusting your filters."
                : "Students and teachers can submit leave from their portals — submitted requests will appear here for review."
            }
          />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRows.map((row) => (
              <div
                key={row._id}
                className="bg-white rounded-xl border border-slate-200 shadow-[0_4px_18px_rgb(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="h-9 w-9 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold">
                      {row.requester_name.substring(0, 1)}
                    </div>
                    <Badge
                      variant={
                        row.status === "approved"
                          ? "success"
                          : row.status === "rejected"
                            ? "error"
                            : row.status === "pending"
                              ? "warning"
                              : "gray"
                      }
                      className="text-[9px] font-bold px-2 py-0.5 capitalize"
                    >
                      {row.status}
                    </Badge>
                  </div>
                  <h3 className="text-[13px] font-bold text-slate-900 truncate">
                    {row.requester_name}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5 capitalize">
                    {row.class_name || row.requester_type} · {row.leave_type}
                  </p>

                  <div className="bg-slate-50/50 rounded-lg p-2 border border-slate-100 mt-3">
                    <p className="text-[9px] font-bold text-slate-400">Time period</p>
                    <p className="text-[11px] font-bold text-slate-700 truncate">
                      {row.start_date}{" "}
                      <span className="text-slate-400 font-normal">to</span> {row.end_date}
                    </p>
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-2 italic mt-3">
                    "{row.reason || "No reason specified"}"
                  </p>
                </div>

                <div className="px-4 py-2 bg-slate-50/40 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`${detailBase}/${row._id}`)}
                    className="text-[10px] font-bold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    View
                  </button>
                  {row.status === "pending" ? (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => approveLeave(row._id)}
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">
                          check_circle
                        </span>
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectingId(row._id)}
                        className="text-[10px] font-bold text-rose-500 hover:text-rose-600 inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">cancel</span>
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 inline-flex items-center gap-1">
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
              rowActions={rowActions}
            />
          </div>
        )}
      </div>

      {rejectingId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 animate-in zoom-in-95 slide-in-from-bottom-2 duration-300">
            <div className="mb-4">
              <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">
                Reject leave request
              </h3>
              <p className="text-[11px] font-bold text-slate-400 mt-1">
                Provide a justification — this is shown to the requester.
              </p>
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 mb-4 text-sm font-medium text-slate-700 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500/10 placeholder:text-slate-300 min-h-[100px]"
              placeholder="Why is this request being declined?"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="h-9 px-4 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReject(rejectingId)}
                className="h-9 px-5 bg-rose-600 text-white rounded-lg text-[11px] font-bold hover:bg-rose-700 shadow-md active:scale-95 transition-all"
              >
                Reject request
              </button>
            </div>
          </div>
        </div>
      )}

      {isTeacher && isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSubmitModalOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <h3 className="text-[15px] font-bold text-slate-900">Apply for leave</h3>
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-5">
              <StudentLeaveSubmitForm
                onSubmit={handleSubmitLeave}
                onCancel={() => setIsSubmitModalOpen(false)}
              />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
