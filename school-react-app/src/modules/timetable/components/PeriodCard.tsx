import { AppIcon } from "shared/ui/AppIcon";
/**
 * Status-aware period card. Renders a single (day, period) cell on the
 * grid. Reuses the platform's compact card chrome — no new tokens.
 *
 * Status colors:
 *   current   → emerald accent + pulse dot
 *   upcoming  → blue accent
 *   completed → slate, dimmed
 *   conflict  → rose accent (overrides above)
 */

import { memo } from "react";
import type { TimetableRecord, PeriodStatus } from "../types/timetable.types";

interface PeriodCardProps {
  slot: TimetableRecord;
  status: PeriodStatus;
  hasConflict: boolean;
  onEdit?: (record: TimetableRecord) => void;
  onDelete?: (id: string) => void;
  isCompact?: boolean;
  canManage?: boolean;
}

const toneByStatus: Record<
  Exclude<PeriodStatus, "free" | "conflict">,
  { bg: string; border: string; text: string; bar: string; meta: string; pill: string }
> = {
  current: {
    bg: "bg-emerald-50/80",
    border: "border-emerald-200",
    text: "text-emerald-900",
    bar: "bg-emerald-500",
    meta: "text-emerald-700/80",
    pill: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  upcoming: {
    bg: "bg-white",
    border: "border-slate-200",
    text: "text-slate-900",
    bar: "bg-blue-500",
    meta: "text-slate-500",
    pill: "bg-blue-50 text-blue-700 border-blue-200",
  },
  completed: {
    bg: "bg-slate-50",
    border: "border-slate-100",
    text: "text-slate-500",
    bar: "bg-slate-300",
    meta: "text-slate-400",
    pill: "bg-slate-100 text-slate-500 border-slate-200",
  },
};

const conflictTone = {
  bg: "bg-rose-50",
  border: "border-rose-200",
  text: "text-rose-900",
  bar: "bg-rose-500",
  meta: "text-rose-700/80",
  pill: "bg-rose-100 text-rose-700 border-rose-200",
};

function statusLabel(status: PeriodStatus): string {
  switch (status) {
    case "current":
      return "Live";
    case "upcoming":
      return "Upcoming";
    case "completed":
      return "Done";
    case "conflict":
      return "Conflict";
    default:
      return "";
  }
}

function PeriodCardImpl({
  slot,
  status,
  hasConflict,
  onEdit,
  onDelete,
  isCompact,
  canManage = true,
}: PeriodCardProps) {
  const effective: PeriodStatus = hasConflict ? "conflict" : status;
  const tone =
    effective === "conflict"
      ? conflictTone
      : toneByStatus[effective as Exclude<PeriodStatus, "free" | "conflict">];

  return (
    <div
      className={`group relative rounded-lg border ${tone.border} ${tone.bg} ${
        isCompact ? "px-2 py-1.5" : "px-2.5 py-2"
      } shadow-[0_2px_8px_rgb(0,0,0,0.02)] hover:shadow-[0_4px_14px_rgb(0,0,0,0.05)] transition-shadow flex flex-col gap-1 h-full overflow-hidden`}
    >
      {/* Status bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${tone.bar}`} />

      {/* Top row: subject + status pill */}
      <div className="flex items-start justify-between gap-1.5">
        <p
          className={`text-[11px] font-bold tracking-tight leading-tight truncate ${tone.text}`}
          title={slot.subject_name}
        >
          {slot.subject_name || "Untitled"}
        </p>
        {effective !== "upcoming" && (
          <span
            className={`shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border text-[8px] font-bold uppercase tracking-wider ${tone.pill}`}
          >
            {effective === "current" && (
              <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
            )}
            {statusLabel(effective)}
          </span>
        )}
      </div>

      {/* Teacher + class */}
      <p className={`text-[10px] font-medium leading-tight truncate ${tone.meta}`}>
        {slot.teacher_name || "No teacher"}
      </p>

      {/* Bottom row: time + room */}
      {!isCompact && (
        <div className="flex items-center justify-between gap-1 pt-1 mt-auto border-t border-slate-100/60">
          <span className={`text-[10px] font-medium tabular-nums ${tone.meta}`}>
            {slot.start_time}–{slot.end_time}
          </span>
          {slot.room && (
            <span className={`text-[10px] font-bold uppercase tracking-tight truncate max-w-[80px] ${tone.meta}`}>
              {slot.room}
            </span>
          )}
        </div>
      )}

      {/* Hover actions */}
      {canManage && (onEdit || onDelete) && (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(slot);
              }}
              className="h-5 w-5 inline-flex items-center justify-center rounded-md bg-white/95 border border-slate-200 text-slate-500 hover:text-blue-600 shadow-sm"
              title="Edit"
              aria-label="Edit period"
            >
              <AppIcon name="Pencil" size={12} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(slot._id);
              }}
              className="h-5 w-5 inline-flex items-center justify-center rounded-md bg-white/95 border border-slate-200 text-slate-500 hover:text-rose-600 shadow-sm"
              title="Delete"
              aria-label="Delete period"
            >
              <AppIcon name="Trash2" size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export const PeriodCard = memo(PeriodCardImpl);
