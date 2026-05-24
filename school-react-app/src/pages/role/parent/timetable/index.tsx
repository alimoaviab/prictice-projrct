import { AppIcon } from "shared/ui/AppIcon";
/**
 * Parent Timetable — premium redesign matching the dashboards/live-class/
 * fees aesthetic.
 *
 * Visual contract:
 *   - Hero strip with the selected child's class, section, year, and a
 *     subtle "Active Session" pulsing badge.
 *   - 4-up KPI row (StatCardCompact) summarising the schedule:
 *       Total Periods · Subjects · Today's Periods · Days Active.
 *   - Day filter pills (All / Mon-Sun) so parents can drill into a single
 *     weekday quickly. The grid below filters in place.
 *   - Premium-card wrapper around the existing `<TimetableGrid>` so the
 *     functional component stays untouched.
 *   - Polished loading and error states.
 *
 * API + behavioural contract preserved exactly: same `useTimetable` hook,
 * same `class_id` filter, same `<TimetableGrid>` rendering. Day-of-week
 * is read directly from the typed `TimetableRecord.day_of_week` (ISO 1..7)
 * so the helpers stay strictly typed and pass `tsc --strict`.
 */

import { useMemo, useState } from "react";

import { SchoolShell } from "@/layouts/SchoolShell";
import {
  DataState,
  StatCardCompact,
  TableSkeleton,
} from "@/components/ui";
import { TimetableGrid } from "@/modules/timetable/components/TimetableGrid";
import { useTimetable } from "@/modules/timetable/hooks/useTimetable";
import type { TimetableRecord } from "@/modules/timetable/types/timetable.types";
import { useSelectedChild } from "@/contexts/SelectedChildContext";

// ────────────────────────────────────────────────────────────────────────
// Day helpers — work directly on the typed `TimetableRecord` shape.
// ISO weekday numbering: 1=Mon, 2=Tue, …, 7=Sun.
// ────────────────────────────────────────────────────────────────────────

const DAYS = [
  { iso: 1, key: "mon", label: "Mon" },
  { iso: 2, key: "tue", label: "Tue" },
  { iso: 3, key: "wed", label: "Wed" },
  { iso: 4, key: "thu", label: "Thu" },
  { iso: 5, key: "fri", label: "Fri" },
  { iso: 6, key: "sat", label: "Sat" },
  { iso: 7, key: "sun", label: "Sun" },
] as const;

type DayIso = (typeof DAYS)[number]["iso"];
type DayFilter = "all" | DayIso;

function todayIso(): DayIso {
  // JS Date.getDay() → 0=Sun..6=Sat. Map to ISO 1..7 (Mon..Sun).
  const js = new Date().getDay();
  return (js === 0 ? 7 : js) as DayIso;
}

// ────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────

export function ParentTimetablePage() {
  const { selectedChild, loading: childLoading } = useSelectedChild();
  const filters = selectedChild?.class_id
    ? { class_id: selectedChild.class_id }
    : undefined;
  const { state } = useTimetable(filters);

  const [activeDay, setActiveDay] = useState<DayFilter>("all");

  // ────────────────────────────────────────────────────────────────────
  // Records — strictly typed `TimetableRecord[]` once we're successful.
  // ────────────────────────────────────────────────────────────────────

  const records = useMemo<TimetableRecord[]>(() => {
    if (state.status === "success" && Array.isArray(state.data)) {
      return state.data as TimetableRecord[];
    }
    return [];
  }, [state]);

  // ────────────────────────────────────────────────────────────────────
  // Aggregated stats for the KPI row.
  // ────────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const today = todayIso();
    const subjects = new Set<string>();
    const days = new Set<number>();
    let todayCount = 0;
    for (const rec of records) {
      const day = Number(rec.day_of_week);
      if (Number.isFinite(day)) days.add(day);
      if (day === today) todayCount += 1;
      subjects.add(rec.subject_name || "—");
    }
    return {
      total: records.length,
      subjects: subjects.size,
      todayCount,
      activeDays: days.size,
    };
  }, [records]);

  const filteredRecords = useMemo<TimetableRecord[]>(() => {
    if (activeDay === "all") return records;
    return records.filter((rec) => Number(rec.day_of_week) === activeDay);
  }, [records, activeDay]);

  // ────────────────────────────────────────────────────────────────────
  // Loading + empty states
  // ────────────────────────────────────────────────────────────────────

  if (childLoading) {
    return (
      <SchoolShell eyebrow="Guardian Portal" title="Weekly Schedule">
        <div className="space-y-4">
          <div className="h-24 w-full rounded-2xl bg-slate-50 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[80px] rounded-xl bg-slate-50 animate-pulse"
              />
            ))}
          </div>
          <TableSkeleton />
        </div>
      </SchoolShell>
    );
  }

  if (!selectedChild) {
    return (
      <SchoolShell eyebrow="Guardian Portal" title="Weekly Schedule">
        <DataState
          variant="empty"
          title="No child selected"
          message="Pick a child from the header to view their academic schedule."
        />
      </SchoolShell>
    );
  }

  // ────────────────────────────────────────────────────────────────────
  return (
    <SchoolShell eyebrow="Guardian Portal" title="Weekly Schedule">
      {/* ── Hero strip ───────────────────────────────────────────────── */}
      <div className="mb-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden relative">
        <div className="relative z-10 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[9px] font-black text-blue-600 uppercase tracking-wider border border-blue-100">
              Academic Timeline
            </span>
            <span className="text-[10px] font-bold text-slate-400 normal-case truncate">
              Viewing: {selectedChild.student_name}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[9px] font-black text-emerald-600 uppercase tracking-wider border border-emerald-100 inline-flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              Active session
            </span>
          </div>

          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Weekly Class Distribution
          </h2>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
            <div className="flex items-center gap-1.5 text-slate-500">
              <AppIcon name="GraduationCap" size={14} />
              <span className="text-[11px] font-bold">
                {selectedChild.class_name}
                {selectedChild.class_section
                  ? ` - ${selectedChild.class_section}`
                  : ""}
              </span>
            </div>
            {selectedChild.academic_year ? (
              <div className="flex items-center gap-1.5 text-slate-500">
                <AppIcon name="Calendar" size={14} />
                <span className="text-[11px] font-bold">
                  {selectedChild.academic_year}
                </span>
              </div>
            ) : null}
            <div className="flex items-center gap-1.5 text-slate-500">
              <AppIcon name="Calendar" size={14} />
              <span className="text-[11px] font-bold">
                {new Date().toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        <AppIcon name="Clock" size={120} className="absolute right-[-10px] bottom-[-20px] text-slate-50 opacity-50 select-none pointer-events-none" />
      </div>

      {/* ── KPI strip ─────────────────────────────────────────────────── */}
      <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCardCompact
          label="Total Periods"
          value={state.status === "success" ? stats.total : "—"}
          icon="event_note"
          accent="blue"
          hint="Across the week"
        />
        <StatCardCompact
          label="Subjects"
          value={state.status === "success" ? stats.subjects : "—"}
          icon="menu_book"
          accent="purple"
          hint="Unique subjects"
        />
        <StatCardCompact
          label="Today"
          value={state.status === "success" ? stats.todayCount : "—"}
          icon="today"
          accent="emerald"
          hint="Periods scheduled"
        />
        <StatCardCompact
          label="Active Days"
          value={state.status === "success" ? stats.activeDays : "—"}
          icon="calendar_today"
          accent="amber"
          hint="Days with classes"
        />
      </div>

      {/* ── Day filter pills ─────────────────────────────────────────── */}
      {state.status === "success" && stats.total > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 px-1">
          <DayPill
            active={activeDay === "all"}
            onClick={() => setActiveDay("all")}
            label="All days"
            count={stats.total}
          />
          {DAYS.map((d) => {
            const count = records.filter(
              (r) => Number(r.day_of_week) === d.iso,
            ).length;
            return (
              <DayPill
                key={d.iso}
                active={activeDay === d.iso}
                onClick={() => setActiveDay(d.iso)}
                label={d.label}
                count={count}
                isToday={d.iso === todayIso()}
              />
            );
          })}
        </div>
      ) : null}

      {/* ── Grid card ─────────────────────────────────────────────────── */}
      <div className="premium-card p-2 sm:p-3.5">
        {state.status === "loading" ? <TableSkeleton /> : null}
        {state.status === "error" ? (
          <DataState
            variant="error"
            title="Schedule sync error"
            message={state.error}
          />
        ) : null}
        {state.status === "success" ? (
          stats.total === 0 ? (
            <PremiumEmpty
              title="No timetable yet"
              message="Once your school publishes the weekly schedule, all periods will appear here."
            />
          ) : filteredRecords.length === 0 ? (
            <PremiumEmpty
              compact
              title="No classes for this day"
              message="Pick another day or switch back to All days to see the full week."
            />
          ) : (
            <TimetableGrid records={filteredRecords} />
          )
        ) : null}
      </div>
    </SchoolShell>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────

interface DayPillProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  isToday?: boolean;
}

function DayPill({ active, onClick, label, count, isToday }: DayPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
        active
          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
          : "bg-white text-slate-600 border-slate-200 hover:border-blue-200 hover:text-blue-600"
      }`}
    >
      {isToday ? (
        <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${active ? "bg-white/70" : "bg-emerald-400"} opacity-75`}
          />
          <span
            className={`relative inline-flex rounded-full h-1.5 w-1.5 ${active ? "bg-white" : "bg-emerald-500"}`}
          />
        </span>
      ) : null}
      {label}
      <span
        className={`text-[9px] font-black tabular-nums px-1 rounded ${
          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function PremiumEmpty({
  title,
  message,
  compact = false,
}: {
  title: string;
  message: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 ${compact ? "p-8" : "p-12"} text-center flex flex-col items-center justify-center`}
    >
      <div
        className={`${compact ? "h-10 w-10" : "h-12 w-12"} rounded-full bg-white shadow-sm flex items-center justify-center mb-3`}
      >
        <AppIcon name="Clock" className={` text-slate-300 ${compact ? "text-[20px]" : "text-[24px]"} `} />
      </div>
      <p
        className={`${compact ? "text-[12px]" : "text-[13px]"} font-black text-slate-700`}
      >
        {title}
      </p>
      <p
        className={`${compact ? "text-[10px]" : "text-[11px]"} text-slate-500 mt-1 max-w-sm`}
      >
        {message}
      </p>
    </div>
  );
}
