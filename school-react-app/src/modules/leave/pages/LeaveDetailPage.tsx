import { AppIcon } from "shared/ui/AppIcon";
/**
 * Admin leave detail page — read-only inspection + approval actions.
 *
 * The list page already supports approve / reject inline; this page is
 * the deep-dive: full reason, attachments, requester profile, decision
 * history. Save flows still go through the same /api/leave/:id PATCH
 * the list page uses, so audit and toasts are consistent.
 */

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Badge,
  DataState,
  Skeleton,
  Button,
} from "@/components/ui";
import { serviceRequest } from "@/services/service-client";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { showToast } from "@/utils/toast";
import { LeaveRecordRow } from "../types/leave.types";
import * as service from "../services/leave.service";

export function LeaveDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { state, run } = useSafeAsync<LeaveRecordRow>();
  const [busy, setBusy] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (!id) return;
    void run(async () => {
      const r = await serviceRequest<LeaveRecordRow>(`/api/leave/${id}`);
      if (!r.ok) throw new Error(r.error.message || "Leave request not found");
      return r.data!;
    });
  }, [id, run]);

  async function approve() {
    setBusy(true);
    try {
      const r = await service.approveLeave(id);
      if (r.ok) {
        showToast("Leave approved.", "success");
        await run(async () => r.data!);
      } else {
        showToast(r.error.message || "Failed to approve", "error");
      }
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    if (!rejectReason.trim()) {
      showToast("Please provide a rejection reason", "error");
      return;
    }
    setBusy(true);
    try {
      const r = await service.rejectLeave(id, rejectReason);
      if (r.ok) {
        showToast("Leave rejected.", "success");
        setShowReject(false);
        setRejectReason("");
        await run(async () => r.data!);
      } else {
        showToast(r.error.message || "Failed to reject", "error");
      }
    } finally {
      setBusy(false);
    }
  }

  async function destroy() {
    if (!window.confirm("Delete this leave request? This action cannot be undone.")) return;
    setBusy(true);
    try {
      const r = await service.deleteLeave(id);
      if (r.ok) {
        showToast("Request deleted.", "success");
        navigate("/admin/leave");
      } else {
        showToast(r.error.message || "Failed to delete", "error");
      }
    } finally {
      setBusy(false);
    }
  }

  if (state.status === "idle" || state.status === "loading") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <DataState variant="error" title="Couldn't load this request" message={state.error} />
    );
  }

  const row = state.data!;
  const isPending = row.status === "pending";

  return (
    <div className="space-y-4 pb-10">
      {/* Compact context header */}
      <div className="flex items-center gap-3">
        <Link
          to="/admin/leave"
          className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100"
          aria-label="Back to leave"
        >
          <AppIcon name="ChevronLeft" size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="text-[16px] font-black text-slate-900 leading-tight truncate">
            Leave request from {row.requester_name}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5 capitalize">
            {row.requester_type} · submitted{" "}
            {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
          </p>
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
          className="capitalize text-[10px] font-bold px-2"
        >
          {row.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Requester" value={row.requester_name} />
              <Field label="Role" value={row.requester_type} capitalize />
              {row.class_name && <Field label="Class" value={row.class_name} />}
              <Field label="Leave type" value={row.leave_type.replace("_", " ")} capitalize />
              <Field label="Start date" value={row.start_date} />
              <Field label="End date" value={row.end_date} />
            </div>

            <div className="mt-5 pt-5 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 mb-1.5">Reason</p>
              <p className="text-[12px] font-medium text-slate-700 whitespace-pre-wrap">
                {row.reason || "—"}
              </p>
            </div>
          </div>

          {row.status === "rejected" && row.rejection_reason && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-rose-700 mb-1">Rejection reason</p>
              <p className="text-[12px] font-medium text-rose-800 whitespace-pre-wrap">
                {row.rejection_reason}
              </p>
            </div>
          )}
        </div>

        {/* Right: actions + audit */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 normal-case">Decision</p>

            {isPending ? (
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  onClick={approve}
                  disabled={busy}
                  className="h-9 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg gap-2"
                >
                  <AppIcon name="CheckCircle2" size={16} />
                  Approve request
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowReject(true)}
                  disabled={busy}
                  className="h-9 w-full bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 text-[11px] font-bold rounded-lg gap-2"
                >
                  <AppIcon name="XCircle" size={16} />
                  Reject…
                </Button>
              </div>
            ) : (
              <div className="text-[11px] font-bold text-slate-500">
                Decision finalized.{" "}
                {row.approved_at && (
                  <span className="text-slate-400 font-medium">
                    on {new Date(row.approved_at).toLocaleString()}
                  </span>
                )}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={destroy}
                disabled={busy || isPending}
                className="text-[10px] font-bold text-rose-500 hover:text-rose-700 inline-flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                title={isPending ? "Decide on the request first" : "Delete this record"}
              >
                <AppIcon name="Trash2" size={14} />
                Delete record
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <p className="text-[10px] font-bold text-slate-400 mb-2">Audit</p>
            <ul className="space-y-2 text-[11px] font-medium text-slate-600">
              <li className="flex items-start gap-2">
                <AppIcon name="Clock" size={14} className="text-slate-400 mt-0.5" />
                Submitted{" "}
                {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
              </li>
              {row.approved_at && (
                <li className="flex items-start gap-2">
                  <AppIcon name="CheckCircle2" size={14} className="text-emerald-500 mt-0.5" />
                  Approved {new Date(row.approved_at).toLocaleString()}
                </li>
              )}
              {row.status === "rejected" && (
                <li className="flex items-start gap-2">
                  <AppIcon name="XCircle" size={14} className="text-rose-500 mt-0.5" />
                  Rejected
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {showReject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 animate-in zoom-in-95 slide-in-from-bottom-2 duration-300">
            <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">
              Reject leave request
            </h3>
            <p className="text-[11px] font-bold text-slate-400 mt-1 mb-3">
              Provide a justification — this is shown to the requester.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 mb-4 text-sm font-medium text-slate-700 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500/10 min-h-[100px]"
              placeholder="Why is this request being declined?"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReject(false)}
                className="h-9 px-4 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={reject}
                disabled={busy}
                className="h-9 px-5 bg-rose-600 text-white rounded-lg text-[11px] font-bold hover:bg-rose-700 shadow-md active:scale-95 transition-all"
              >
                Reject request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400">{label}</p>
      <p
        className={`text-[12px] font-bold text-slate-900 mt-0.5 ${
          capitalize ? "capitalize" : ""
        }`}
      >
        {value || "—"}
      </p>
    </div>
  );
}
