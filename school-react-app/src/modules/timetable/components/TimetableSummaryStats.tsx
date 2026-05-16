/**
 * Compact dashboard stats for /admin/timetable.
 *
 * Reuses the platform's StatCardCompact (same primitive used on the
 * Academic Year and Dashboard pages). Six tiles, two rows on mobile,
 * one row on lg+.
 */

import { StatCardCompact } from "@/components/ui";
import type { TimetableSummary } from "../types/timetable.types";

interface Props {
  summary?: TimetableSummary;
  isLoading?: boolean;
}

function CountSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 ring-1 ring-slate-900/5 px-3.5 py-3 shadow-[0_4px_18px_rgb(0,0,0,0.03)]">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-slate-100 animate-pulse" />
        <div className="flex-1 space-y-1.5">
          <div className="h-2.5 w-16 rounded-full bg-slate-100 animate-pulse" />
          <div className="h-4 w-10 rounded-md bg-slate-100 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function TimetableSummaryStats({ summary, isLoading }: Props) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CountSkeleton key={i} />
        ))}
      </div>
    );
  }

  const items = [
    {
      label: "Total Classes",
      value: summary.totalClasses,
      icon: "school",
      accent: "blue" as const,
      hint:
        summary.classesScheduled === summary.totalClasses
          ? "All scheduled"
          : `${summary.classesScheduled} scheduled`,
    },
    {
      label: "Periods Today",
      value: summary.totalPeriodsToday,
      icon: "schedule",
      accent: "purple" as const,
      hint: `${summary.completedPeriodsToday} done · ${summary.upcomingPeriodsToday} upcoming`,
    },
    {
      label: "Active Now",
      value: summary.activePeriodsNow,
      icon: "play_circle",
      accent: "emerald" as const,
      hint: summary.currentPeriod
        ? `${summary.currentPeriod.subject_name} · ${summary.currentPeriod.class_name}`
        : "No live periods",
    },
    {
      label: "Free Teachers",
      value: summary.freeTeachersNow,
      icon: "groups",
      accent: "slate" as const,
      hint: `${summary.teachersTeachingNow} teaching now`,
    },
    {
      label: "Conflicts",
      value: summary.conflictsCount,
      icon: "warning",
      accent: summary.conflictsCount > 0 ? ("rose" as const) : ("slate" as const),
      hint: summary.conflictsCount > 0 ? "Review the grid" : "All clear",
    },
    {
      label: "Unscheduled",
      value: summary.classesUnscheduled,
      icon: "event_busy",
      accent: summary.classesUnscheduled > 0 ? ("amber" as const) : ("slate" as const),
      hint:
        summary.classesUnscheduled > 0
          ? "Classes without timetable"
          : "Coverage complete",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((it) => (
        <StatCardCompact
          key={it.label}
          label={it.label}
          value={it.value}
          icon={it.icon}
          accent={it.accent}
          hint={it.hint}
        />
      ))}
    </div>
  );
}
