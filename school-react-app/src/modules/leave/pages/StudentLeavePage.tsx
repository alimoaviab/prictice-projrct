import { useState, useMemo } from "react";
import { useLeave } from "../hooks/useLeave";
import { LeaveRecordRow } from "../types/leave.types";
import { PageHeader, DataTable, Badge, Button, DataState, DataTableColumn } from "@/components/ui";
import { motion, AnimatePresence } from "framer-motion";
import LeaveForm from "../components/LeaveForm";

export default function StudentLeavePage() {
  const { state, addLeave } = useLeave();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = async (data: any) => {
    const res = await addLeave(data);
    if (res.ok) {
      setIsModalOpen(false);
    }
  };

  const formatDate = (dateStr: string, formatType: 'date' | 'datetime' = 'date') => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (formatType === 'datetime') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const columns: DataTableColumn<LeaveRecordRow>[] = useMemo(() => [
    {
      key: "leave_type",
      label: "Type",
      render: (row) => <span className="capitalize font-medium">{row.leave_type}</span>
    },
    {
      key: "duration",
      label: "Duration",
      render: (row) => (
        <span className="text-xs text-slate-600">
          {formatDate(row.start_date)} - {formatDate(row.end_date)}
        </span>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const variants: Record<string, any> = {
          pending: "warning",
          approved: "success",
          rejected: "error",
          cancelled: "neutral"
        };
        return <Badge variant={variants[row.status] || "neutral"}>{row.status.toUpperCase()}</Badge>;
      }
    },
    {
      key: "reason",
      label: "Reason",
      render: (row) => <span className="text-sm text-gray-600 line-clamp-1">{row.reason}</span>
    },
    {
      key: "created_at",
      label: "Submitted",
      render: (row) => <span className="text-xs text-slate-500">{formatDate(row.created_at || "", 'datetime')}</span>
    }
  ], []);

  if (state.status === "error") {
    return <DataState variant="error" title="Failed to load leave" message={state.error} />;
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="My Leave Requests"
        description="View and submit your leave applications."
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <span className="material-symbols-outlined text-lg mr-2">add</span>
            Submit Leave
          </Button>
        }
      />

      <DataTable
        columns={columns}
        rows={state.data || []}
        isLoading={state.status === "loading"}
        emptyState={{
          title: "No Leave Requests",
          description: "You haven't submitted any leave requests yet."
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
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Apply for Leave</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-6 max-h-[80vh] overflow-y-auto">
                <LeaveForm
                  onSubmit={handleSubmit}
                  onCancel={() => setIsModalOpen(false)}
                  requesters={[]}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
