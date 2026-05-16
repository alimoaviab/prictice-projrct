/**
 * Empty state for the timetable grid.
 *
 * Replaces the giant `event_busy` whitespace block with a compact,
 * actionable onboarding card. Shows three quick actions plus, when
 * relevant, the list of unscheduled classes so the admin sees exactly
 * which classes still need a timetable.
 */

import { Link } from "react-router-dom";
import type { TimetableSummary } from "../types/timetable.types";

interface Props {
  classId?: string;
  className?: string;
  onCreate: () => void;
  unscheduled?: TimetableSummary["unscheduledClasses"];
  onSelectClass?: (id: string) => void;
}

function GuidanceCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 bg-slate-50/60 border border-slate-200 rounded-lg px-3 py-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white border border-slate-200 text-blue-600">
        <span className="material-symbols-outlined text-base">{icon}</span>
      </div>
      <div>
        <p className="text-[11px] font-bold text-slate-900 tracking-tight">{title}</p>
        <p className="text-[11px] leading-relaxed text-slate-500 font-medium mt-0.5">
          {children}
        </p>
      </div>
    </div>
  );
}

export function TimetableEmptyState({
  classId,
  className,
  onCreate,
  unscheduled,
  onSelectClass,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 ring-1 ring-slate-900/5 shadow-[0_4px_18px_rgb(0,0,0,0.03)] overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
        {/* Left — main empty state */}
        <div className="px-6 py-8 md:px-8 md:py-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-4">
            <span className="material-symbols-outlined text-xl">event_busy</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            {classId
              ? `No timetable for ${className ?? "this class"} yet`
              : "Build your weekly schedule"}
          </h3>
          <p className="mt-1.5 text-[13px] leading-6 text-slate-500 max-w-xl font-medium">
            {classId
              ? "Add the first period and the grid will fill in. Conflicts (teacher, room, class overlap) are detected automatically as you add periods."
              : "Pick a class from the selector above, or jump straight into adding a period. The grid below will populate as you add sessions."}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-blue-600 text-white text-[12px] font-bold shadow-sm shadow-blue-600/15 hover:bg-blue-700 transition-colors active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Add a period
            </button>
            <Link
              to="/admin/classes"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg border border-slate-200 bg-white text-[12px] font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700 transition-colors"
            >
              <span className="material-symbols-outlined text-base">school</span>
              Manage classes
            </Link>
            <Link
              to="/admin/teachers"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg border border-slate-200 bg-white text-[12px] font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700 transition-colors"
            >
              <span className="material-symbols-outlined text-base">person</span>
              Manage teachers
            </Link>
          </div>

          <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <GuidanceCard icon="bolt" title="Fast entry">
              Subject + teacher + day + time. Conflicts are flagged in red.
            </GuidanceCard>
            <GuidanceCard icon="schedule" title="Live view">
              The current running period is highlighted on the grid.
            </GuidanceCard>
            <GuidanceCard icon="shield_person" title="Safe by default">
              Only admins can create or edit. Teachers and parents see read-only.
            </GuidanceCard>
          </div>
        </div>

        {/* Right — unscheduled classes side panel */}
        <div className="border-t lg:border-t-0 lg:border-l border-slate-100 bg-slate-50/40 px-5 py-6">
          <p className="text-[10px] font-bold text-slate-400 normal-case mb-2">
            Unscheduled classes
          </p>
          {!unscheduled || unscheduled.length === 0 ? (
            <p className="text-[12px] font-medium text-slate-500">
              All classes are scheduled.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {unscheduled.slice(0, 8).map((c) => (
                <li key={c._id}>
                  <button
                    type="button"
                    onClick={() => onSelectClass?.(c._id)}
                    className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-700 transition-colors text-left"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-base text-amber-500">
                        warning
                      </span>
                      <span className="text-[12px] font-bold text-slate-700 truncate">
                        {c.name}
                        {c.section ? ` (${c.section})` : ""}
                      </span>
                    </span>
                    <span className="material-symbols-outlined text-base text-slate-400">
                      chevron_right
                    </span>
                  </button>
                </li>
              ))}
              {unscheduled.length > 8 && (
                <li className="text-[11px] font-bold text-slate-400 normal-case px-2 pt-1">
                  +{unscheduled.length - 8} more
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
