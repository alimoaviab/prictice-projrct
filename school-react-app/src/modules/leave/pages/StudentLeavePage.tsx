/**
 * Student "My leave requests" page.
 *
 * Server-side enforcement (RBAC + handler) restricts the list to the
 * caller's own student record, so this page can call the same generic
 * /api/leave list endpoint as the admin and rely on the backend to
 * scope down. Submission goes through StudentLeaveSubmitForm which
 * does NOT show a requester picker — the backend binds the requester
 * from the session.
 */

import { useState, useMemo } from "react";
import { useLeave } from "../hooks/useLeave";
import { LeaveRecordRow, LeaveFormInput } from "../types/leave.types";
import { Badge, Button, DataState, DataTable, DataTableColumn, PageHeader } from "@/components/ui";
import { motion, AnimatePresence } from "framer-motion";
import { StudentLeaveSubmitForm } from "../components/StudentLeaveSubmitForm";

export default function StudentLeavePage() {
  const { state, addLeave } = useLeave();
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function handleSubmit(data: LeaveFormInput) {
    const res = await addLeave(data);
    if ((res as any).ok) setIsModalOpen(false);
  }

  function fmt(dateStr: string, kind: "date" | "datetime" = "date") {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (kind === "datetime") {
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  const columns: DataTableColumn<LeaveRecordRow>[] = useMemo(
    () => [
      {
        key: "leave_type",
        label: "Type",
        render: (row) => <span className="capitalize font-medium">{row.leave_type}</span>,
      },
      {
        key: "duration",
        label: "Duration",
        render: (row) => (
          <span className="text-xs text-slate-600">
            {fmt(row.start_date)} - {fmt(row.end_date)}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (row) => {
          const variants: Record<string, any> = {
            pending: "warning",
            approved: "success",
            rejected: "error",
            cancelled: "gray",
          };
          return (
            <Badge variant={variants[row.status] || "gray"} className="capitalize">
              {row.status}
            </Badge>
          );
        },
      },
      {
        key: "reason",
        label: "Reason",
        render: (row) => (
          <span className="text-sm text-gray-600 line-clamp-1">{row.reason}</span>
        ),
      },
      {
        key: "created_at",
        label: "Submitted",
        render: (row) => (
          <span className="text-xs text-slate-500">{fmt(row.created_at || "", "datetime")}</span>
        ),
      },
    ],
    []
  );

  if (state.status === "error") {
    return <DataState variant="error" title="Failed to load leave" message={state.error} />;
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="My leave requests"
        description="View and submit your leave applications. Approval status appears here."
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <span className="material-symbols-outlined text-lg mr-2">add</span>
            Submit leave
          </Button>
        }
      />

      <DataTable
        columns={columns}
        rows={state.data || []}
        isLoading={state.status === "loading"}
        emptyState={{
          title: "No leave requests yet",
          description:
            "When you submit a leave request, it'll show up here with its approval status.",
        }}
      />

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
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
                  onClick={() => setIsModalOpen(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                  aria-label="Close"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-5">
                <StudentLeaveSubmitForm
                  onSubmit={handleSubmit}
                  onCancel={() => setIsModalOpen(false)}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
