/**
 * Behavior detail page — admin / teacher review surface.
 *
 * Reuses the same /api/behavior/:id PATCH endpoint the list page calls
 * for inline status changes, so audit logs stay consistent. No new
 * backend hooks introduced.
 */

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge, Button, DataState, Skeleton } from "@/components/ui";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import { showToast } from "@/utils/toast";
import { BehaviorRecordRow } from "../types/behavior.types";
import * as service from "../services/behavior.service";

interface Props {
  role?: "admin" | "teacher" | "parent";
}

export function BehaviorDetailPage({ role = "admin" }: Props) {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { state, run } = useSafeAsync<BehaviorRecordRow>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    void run(async () => {
      const r = await serviceRequest<BehaviorRecordRow>(`/api/behavior/${id}`);
      if (!r.ok) throw new Error(r.error.message || "Behavior record not found");
      return r.data!;
    });
  }, [id, run]);

  async function changeStatus(status: string) {
    setBusy(true);
    try {
      const r = await service.updateBehavior(id, { status } as any);
      if ((r as any).ok || r.success) {
        showToast(`Marked as ${status.replace("_", " ")}.`, "success");
        await run(async () => ((r as any).data || state.data) as BehaviorRecordRow);
      } else {
        showToast(r.message || "Failed to update", "error");
      }
    } finally {
      setBusy(false);
    }
  }

  async function destroy() {
    if (!window.confirm("Delete this behavior report? This cannot be undone.")) return;
    setBusy(true);
    try {
      const r = await service.deleteBehavior(id);
      if ((r as any).ok || r.success) {
        showToast("Report deleted.", "success");
        navigate("/admin/behavior");
      } else {
        showToast(r.message || "Failed to delete", "error");
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
      <DataState variant="error" title="Couldn't load this report" message={state.error} />
    );
  }

  const row = state.data!;
  const backTo =
    role === "teacher"
      ? "/teacher/behavior"
      : role === "parent"
        ? "/parent/behavior"
        : "/admin/behavior";

  const canModerate = role !== "parent";

  return (
    <div className="space-y-4 pb-10">
      <div className="flex items-center gap-3">
        <Link
          to={backTo}
          className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100"
          aria-label="Back"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="text-[16px] font-black text-slate-900 leading-tight truncate">
            Behavior report — {row.student_name}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">
            Reported by {row.teacher_name || "Admin"} ·{" "}
            {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
          </p>
        </div>
        <Badge
          variant={
            row.severity === "critical"
              ? "error"
              : row.severity === "major"
                ? "warning"
                : "primary"
          }
          className="capitalize text-[10px] font-bold px-2"
        >
          {row.severity}
        </Badge>
        <Badge
          variant={
            row.status === "resolved"
              ? "success"
              : row.status === "open"
                ? "warning"
                : row.status === "reviewing"
                  ? "primary"
                  : row.status === "escalated"
                    ? "error"
                    : "gray"
          }
          className="capitalize text-[10px] font-bold px-2"
        >
          {row.status.replace("_", " ")}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Student" value={row.student_name} />
              <Field label="Class" value={row.class_name} />
              <Field
                label="Category"
                value={row.category || row.incident_type}
                capitalize
              />
              <Field label="Severity" value={row.severity} capitalize />
              <Field label="Warnings" value={String(row.warning_count ?? 0)} />
              <Field
                label="Parent notified"
                value={row.parent_notified ? "Yes" : "No"}
              />
            </div>

            <div className="mt-5 pt-5 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 mb-1.5">Description</p>
              <p className="text-[12px] font-medium text-slate-700 whitespace-pre-wrap">
                {row.description || "—"}
              </p>
            </div>

            {row.action_taken && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 mb-1.5">Action taken</p>
                <p className="text-[12px] font-medium text-slate-700 whitespace-pre-wrap">
                  {row.action_taken}
                </p>
              </div>
            )}

            {row.notes && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 mb-1.5">Notes</p>
                <p className="text-[12px] font-medium text-slate-700 whitespace-pre-wrap">
                  {row.notes}
                </p>
              </div>
            )}

            {row.attachments && row.attachments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 mb-1.5">Attachments</p>
                <ul className="space-y-1">
                  {row.attachments.map((a, i) => (
                    <li key={i}>
                      <a
                        href={a}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[12px] font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-base">
                          attach_file
                        </span>
                        Attachment {i + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {canModerate && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-2">
              <p className="text-[10px] font-bold text-slate-400">Actions</p>
              {row.status === "open" && (
                <Button
                  type="button"
                  onClick={() => changeStatus("reviewing")}
                  disabled={busy}
                  className="h-9 w-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                  Start review
                </Button>
              )}
              {row.status === "reviewing" && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    onClick={() => changeStatus("resolved")}
                    disabled={busy}
                    className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg gap-1"
                  >
                    Resolve
                  </Button>
                  <Button
                    type="button"
                    onClick={() => changeStatus("escalated")}
                    disabled={busy}
                    className="h-9 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg gap-1"
                  >
                    Escalate
                  </Button>
                  <Button
                    type="button"
                    onClick={() => changeStatus("dismissed")}
                    disabled={busy}
                    className="col-span-2 h-9 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold rounded-lg gap-1"
                  >
                    Dismiss
                  </Button>
                </div>
              )}
              {(row.status === "resolved" ||
                row.status === "dismissed" ||
                row.status === "escalated") && (
                <p className="text-[11px] font-bold text-slate-500">
                  Finalized status. Reopen by reverting to "reviewing" if needed.
                </p>
              )}

              {role === "admin" && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={destroy}
                    disabled={busy}
                    className="text-[10px] font-bold text-rose-500 hover:text-rose-700 inline-flex items-center gap-1 disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    Delete record
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <p className="text-[10px] font-bold text-slate-400 mb-2">Audit</p>
            <ul className="space-y-2 text-[11px] font-medium text-slate-600">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[14px] text-slate-400 mt-0.5">
                  schedule
                </span>
                Created{" "}
                {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
              </li>
              {row.updated_at && row.updated_at !== row.created_at && (
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[14px] text-blue-500 mt-0.5">
                    update
                  </span>
                  Updated {new Date(row.updated_at).toLocaleString()}
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
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
