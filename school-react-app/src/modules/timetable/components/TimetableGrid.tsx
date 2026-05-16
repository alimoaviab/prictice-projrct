/**
 * Weekly timetable grid (Mon–Sat by default; Sun shown when records
 * exist on Sunday).
 *
 * Performance:
 *   - Records are bucketed once into a Map keyed by `${day}_${period}`
 *     (memoized) so the per-cell lookup is O(1) regardless of how many
 *     records the school has.
 *   - The conflict map is also computed once (single sweep, O(n²) with
 *     the small constant of overlapping bucket sizes).
 *   - Period rows are derived from the records themselves — we don't
 *     rasterize hour-by-hour. This means a school with 8 periods only
 *     renders 8 rows, not 11.
 *   - PeriodCard is memo'd.
 *
 * Sticky:
 *   - Day header sticks to the top of the scroll container.
 *   - Time gutter sticks to the left.
 */

import { useEffect, useMemo, useState } from "react";
import {
  TimetableRecord,
  SHORT_DAY_BY_ISO,
  todayISO,
  PeriodStatus,
} from "../types/timetable.types";
import { PeriodCard } from "./PeriodCard";
import { findTimetableConflicts, periodStatus } from "../utils/conflicts";

interface Props {
  records: TimetableRecord[];
  onEdit?: (rec: TimetableRecord) => void;
  onDelete?: (id: string) => void;
  isCompact?: boolean;
  canManage?: boolean;
  /** When set, render only periods belonging to this class. */
  classFilter?: string;
}

interface PeriodRow {
  period: number;
  start: string;
  end: string;
}

function timeKey(rec: TimetableRecord) {
  return `${rec.start_time}-${rec.end_time}-${rec.period_number}`;
}

export function TimetableGrid({
  records,
  onEdit,
  onDelete,
  isCompact,
  canManage = true,
  classFilter,
}: Props) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const today = todayISO();

  const filtered = useMemo(
    () => (classFilter ? records.filter((r) => r.class_id === classFilter) : records),
    [records, classFilter]
  );

  // Determine which days to render — always Mon..Sat, plus Sun only if used.
  const visibleDays = useMemo(() => {
    const days = [1, 2, 3, 4, 5, 6];
    if (filtered.some((r) => Number(r.day_of_week) === 7)) days.push(7);
    return days;
  }, [filtered]);

  // Bucket records by `${day}_${period}` for O(1) cell lookup.
  const cellMap = useMemo(() => {
    const map = new Map<string, TimetableRecord[]>();
    for (const r of filtered) {
      const key = `${r.day_of_week}_${r.period_number}`;
      const arr = map.get(key);
      if (arr) arr.push(r);
      else map.set(key, [r]);
    }
    return map;
  }, [filtered]);

  // Distinct period rows (period number + canonical start/end), sorted.
  const periodRows: PeriodRow[] = useMemo(() => {
    const seen = new Map<string, PeriodRow>();
    for (const r of filtered) {
      const key = `${r.period_number}_${r.start_time}_${r.end_time}`;
      if (!seen.has(key)) {
        seen.set(key, {
          period: r.period_number,
          start: r.start_time,
          end: r.end_time,
        });
      }
    }
    return Array.from(seen.values()).sort((a, b) => {
      if (a.period !== b.period) return a.period - b.period;
      return a.start.localeCompare(b.start);
    });
  }, [filtered]);

  // Conflict set: a record id is conflicted if findTimetableConflicts returns >0.
  const conflictedIds = useMemo(() => {
    const s = new Set<string>();
    for (const r of filtered) {
      if (s.has(r._id)) continue;
      const c = findTimetableConflicts(filtered, r);
      if (c.length > 0) s.add(r._id);
    }
    return s;
  }, [filtered]);

  if (periodRows.length === 0) {
    // The page wraps an empty state above when records.length === 0,
    // but we still render a tiny placeholder if a filter eliminated all
    // matches (e.g. switching to a class with no schedule).
    return (
      <div className="bg-white rounded-xl border border-slate-200 ring-1 ring-slate-900/5 px-6 py-10 text-center shadow-[0_4px_18px_rgb(0,0,0,0.03)]">
        <p className="text-[12px] font-bold text-slate-500">
          No periods match the current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 ring-1 ring-slate-900/5 shadow-[0_4px_18px_rgb(0,0,0,0.03)] overflow-hidden">
      <div className="overflow-x-auto">
        <div
          className="min-w-[820px] grid"
          style={{
            gridTemplateColumns: `90px repeat(${visibleDays.length}, minmax(140px, 1fr))`,
          }}
        >
          {/* Header */}
          <div className="sticky top-0 z-30 bg-slate-50/90 backdrop-blur border-b border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-500 normal-case">
            Time
          </div>
          {visibleDays.map((d) => {
            const isToday = d === today;
            return (
              <div
                key={`h-${d}`}
                className={`sticky top-0 z-30 backdrop-blur border-b border-slate-200 px-3 py-2 ${
                  isToday ? "bg-blue-50/80" : "bg-slate-50/90"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold normal-case ${
                      isToday ? "text-blue-700" : "text-slate-600"
                    }`}
                  >
                    {SHORT_DAY_BY_ISO[d]}
                  </span>
                  {isToday && (
                    <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-600 text-white">
                      Today
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Rows */}
          {periodRows.map((row, rowIdx) => (
            <RowFragment
              key={`r-${row.period}-${row.start}`}
              row={row}
              visibleDays={visibleDays}
              isLast={rowIdx === periodRows.length - 1}
              cellMap={cellMap}
              conflictedIds={conflictedIds}
              today={today}
              now={now}
              onEdit={onEdit}
              onDelete={onDelete}
              isCompact={isCompact}
              canManage={canManage}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function RowFragment({
  row,
  visibleDays,
  isLast,
  cellMap,
  conflictedIds,
  today,
  now,
  onEdit,
  onDelete,
  isCompact,
  canManage,
}: {
  row: PeriodRow;
  visibleDays: number[];
  isLast: boolean;
  cellMap: Map<string, TimetableRecord[]>;
  conflictedIds: Set<string>;
  today: number;
  now: Date;
  onEdit?: (r: TimetableRecord) => void;
  onDelete?: (id: string) => void;
  isCompact?: boolean;
  canManage?: boolean;
}) {
  const heightClass = isCompact ? "min-h-[64px]" : "min-h-[88px]";
  const borderClass = isLast ? "" : "border-b border-slate-100";

  return (
    <>
      <div
        className={`sticky left-0 z-20 bg-white border-r border-slate-100 ${borderClass} ${heightClass} flex flex-col items-start justify-center px-3 py-2`}
      >
        <span className="text-[9px] font-bold text-slate-400 normal-case">
          P{row.period}
        </span>
        <span className="text-[11px] font-bold text-slate-700 tabular-nums leading-tight">
          {row.start}
        </span>
        <span className="text-[10px] font-medium text-slate-400 tabular-nums leading-tight">
          {row.end}
        </span>
      </div>
      {visibleDays.map((d) => {
        const cells = cellMap.get(`${d}_${row.period}`) ?? [];
        const isToday = d === today;
        return (
          <div
            key={`c-${d}-${row.period}`}
            className={`relative ${borderClass} ${heightClass} border-r border-slate-100 last:border-r-0 p-1.5 ${
              isToday ? "bg-blue-50/20" : ""
            }`}
          >
            {cells.length === 0 ? (
              <FreeCellPlaceholder isToday={isToday} />
            ) : (
              <div className="flex flex-col gap-1 h-full">
                {cells.map((rec) => {
                  const status: PeriodStatus = periodStatus(rec, now);
                  return (
                    <PeriodCard
                      key={rec._id}
                      slot={rec}
                      status={status}
                      hasConflict={conflictedIds.has(rec._id)}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      isCompact={isCompact}
                      canManage={canManage}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

function FreeCellPlaceholder({ isToday }: { isToday: boolean }) {
  return (
    <div
      className={`h-full w-full rounded-lg border border-dashed flex items-center justify-center ${
        isToday ? "border-blue-100 text-blue-300" : "border-slate-100 text-slate-300"
      }`}
    >
      <span className="text-[10px] font-bold uppercase tracking-wider">Free</span>
    </div>
  );
}
