import { AppIcon } from "shared/ui/AppIcon";
/**
 * Live "what's happening right now" strip used at the top of the
 * timetable dashboard. Two compact cards: the current running period
 * (with countdown to its end) and the next upcoming period today.
 */

import { useEffect, useState } from "react";
import type { TimetableRecord, TimetableSummary } from "../types/timetable.types";

interface Props {
  summary?: TimetableSummary;
}

function timeToMin(t: string): number {
  if (!t) return -1;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function fmtCountdown(mins: number): string {
  if (mins <= 0) return "Ending now";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

function fmtUntil(mins: number): string {
  if (mins <= 0) return "Starting now";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `In ${h}h ${m}m`;
  return `In ${m}m`;
}

function PeriodTile({
  rec,
  tone,
  label,
  meta,
}: {
  rec: TimetableRecord;
  tone: "live" | "upcoming";
  label: string;
  meta: string;
}) {
  const isLive = tone === "live";
  const accentBg = isLive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200";
  const dotClass = isLive ? "bg-emerald-500 animate-pulse" : "bg-blue-500";

  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 ring-1 ring-slate-900/5 px-4 py-3 shadow-[0_4px_18px_rgb(0,0,0,0.03)] flex-1 min-w-0">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${accentBg}`}>
        <AppIcon name={isLive ? "play_circle" : "schedule"} size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
          <span className="text-[10px] font-bold text-slate-400 normal-case truncate">
            {label}
          </span>
        </div>
        <p className="mt-0.5 text-sm font-bold text-slate-900 tracking-tight truncate">
          {rec.subject_name}
          <span className="text-slate-400 font-medium">
            {" · "}
            {rec.class_name}
            {rec.section ? ` (${rec.section})` : ""}
          </span>
        </p>
        <p className="mt-0.5 text-[11px] font-medium text-slate-500 truncate">
          {rec.teacher_name || "No teacher"} · {rec.start_time}–{rec.end_time}
          {rec.room ? ` · ${rec.room}` : ""}
        </p>
      </div>
      <div className="text-right shrink-0">
        <span className="text-[10px] font-bold text-slate-400 normal-case block">
          Status
        </span>
        <span className={`text-[11px] font-bold tracking-tight ${isLive ? "text-emerald-600" : "text-blue-600"}`}>
          {meta}
        </span>
      </div>
    </div>
  );
}

export function TimetableLivePeriodCard({ summary }: Props) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30 * 1000);
    return () => clearInterval(id);
  }, []);

  if (!summary) return null;

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const cur = summary.currentPeriod;
  const next = summary.nextPeriod;

  if (!cur && !next) {
    return (
      <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 ring-1 ring-slate-900/5 px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <AppIcon name="CalendarCheck" size={18} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 normal-case">Today</p>
          <p className="text-sm font-bold text-slate-900 tracking-tight">
            No periods scheduled for today.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-3">
      {cur && (
        <PeriodTile
          rec={cur}
          tone="live"
          label="Live now"
          meta={fmtCountdown(timeToMin(cur.end_time) - nowMin)}
        />
      )}
      {next && (
        <PeriodTile
          rec={next}
          tone="upcoming"
          label="Up next"
          meta={fmtUntil(timeToMin(next.start_time) - nowMin)}
        />
      )}
    </div>
  );
}
