/**
 * /admin/timetable — main dashboard page.
 *
 * Layout (top to bottom):
 *   1. Toolbar (compact, searchable class selector, "New period" CTA)
 *   2. 6-up summary stat tiles (today's periods, active now, conflicts…)
 *   3. Live + next period strip
 *   4. Either:
 *        - The compact, status-aware weekly grid, OR
 *        - The redesigned empty state with quick actions and the list
 *          of unscheduled classes.
 *
 * Performance:
 *   - State is per-class via the existing useTimetable filter, so we
 *     only fetch + render the records relevant to the selected view.
 *   - Summary counters come from a single /api/timetable/summary call
 *     that the backend caches in Redis (60s).
 *   - Grid uses memoized bucket maps; PeriodCard is memo'd.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  DataState,
  ConfirmModal,
} from "@/components/ui";
import { useClasses } from "../../classes/hooks/useClasses";
import { useTimetable, useTimetableSummary } from "../hooks/useTimetable";
import { TimetableToolbar } from "../components/TimetableToolbar";
import { TimetableGrid } from "../components/TimetableGrid";
import { TimetableSummaryStats } from "../components/TimetableSummaryStats";
import { TimetableLivePeriodCard } from "../components/TimetableLivePeriodCard";
import { TimetableEmptyState } from "../components/TimetableEmptyState";
import type { TimetableRecord } from "../types/timetable.types";
import { findTimetableConflicts } from "../utils/conflicts";
import { showToast } from "@/utils/toast";

export function TimetablePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlClassId = searchParams.get("class_id") || "";

  const [classId, setClassId] = useState(urlClassId);
  const [isCompact, setIsCompact] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<TimetableRecord | null>(null);

  useEffect(() => {
    if (urlClassId !== classId) setClassId(urlClassId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlClassId]);

  const { state: classesState } = useClasses();
  const { state: summaryState } = useTimetableSummary();
  const { state, deleteTimetable, refresh } = useTimetable(
    classId ? { class_id: classId } : undefined
  );

  const classOptions = useMemo(() => {
    const raw =
      ((classesState.data as any)?.data ||
        (classesState.data as any) ||
        []) as Array<{ _id: string; name: string; section?: string }>;
    return raw.map((c) => ({
      id: c._id,
      label: c.section ? `${c.name} (${c.section})` : c.name,
      section: c.section,
    }));
  }, [classesState.data]);

  const conflictsCount = useMemo(() => {
    const data = state.data ?? [];
    if (data.length === 0) return 0;
    let count = 0;
    const seen = new Set<string>();
    for (const rec of data) {
      if (seen.has(rec._id)) continue;
      const c = findTimetableConflicts(data, rec);
      if (c.length > 0) {
        count += 1;
        seen.add(rec._id);
      }
    }
    return count;
  }, [state.data]);

  const summary = summaryState.data;

  function handleClassChange(id: string) {
    setClassId(id);
    if (id) setSearchParams({ class_id: id });
    else setSearchParams({});
  }

  function handleNewEntry() {
    const url = classId
      ? `/admin/timetable/create?class_id=${encodeURIComponent(classId)}`
      : `/admin/timetable/create`;
    navigate(url);
  }

  function handleEdit(rec: TimetableRecord) {
    navigate(`/admin/timetable/edit/${encodeURIComponent(rec._id)}`);
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    const result = await deleteTimetable(pendingDelete._id);
    setPendingDelete(null);
    if (result.ok) refresh();
  }

  function handleDelete(id: string) {
    const rec = (state.data ?? []).find((r) => r._id === id) || null;
    setPendingDelete(rec);
  }

  function loadingError(): string | undefined {
    if (state.status === "error") return state.error;
    if (summaryState.status === "error") return summaryState.error;
    return undefined;
  }

  const records = state.data ?? [];
  const showEmpty =
    state.status === "success" && records.length === 0 && !loadingError();

  return (
    <div className="space-y-6 pb-12">
      <TimetableSummaryStats
        summary={summary}
        isLoading={summaryState.status === "loading" || summaryState.status === "idle"}
      />

      <TimetableToolbar
        classId={classId}
        onClassChange={handleClassChange}
        classOptions={classOptions}
        onNewEntry={handleNewEntry}
        conflictsCount={conflictsCount}
        isCompact={isCompact}
        onCompactToggle={() => setIsCompact((v) => !v)}
      />

      {summary && (summary.currentPeriod || summary.nextPeriod) && (
        <TimetableLivePeriodCard summary={summary} />
      )}

      {(state.status === "loading" || state.status === "idle") && (
        <GridSkeleton />
      )}

      {state.status === "error" && (
        <DataState
          variant="error"
          title="Couldn't load timetable"
          message={state.error}
          onRetry={() => {
            void refresh();
            showToast("Retrying…", "success");
          }}
        />
      )}

      {showEmpty && (
        <TimetableEmptyState
          classId={classId}
          className={
            classOptions.find((c) => c.id === classId)?.label ?? undefined
          }
          onCreate={handleNewEntry}
          unscheduled={summary?.unscheduledClasses}
          onSelectClass={handleClassChange}
        />
      )}

      {state.status === "success" && records.length > 0 && (
        <TimetableGrid
          records={records}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isCompact={isCompact}
          canManage
        />
      )}

      <ConfirmModal
        isOpen={pendingDelete !== null}
        title="Remove this period?"
        message={
          pendingDelete
            ? `Removing "${pendingDelete.subject_name}" on ${
                pendingDelete.start_time
              }–${pendingDelete.end_time} for ${pendingDelete.class_name}. This cannot be undone.`
            : ""
        }
        confirmLabel="Remove"
        confirmVariant="danger"
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 ring-1 ring-slate-900/5 shadow-[0_4px_18px_rgb(0,0,0,0.03)] overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-200">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="px-3 py-2.5 bg-slate-50/80">
            <div className="h-3 w-12 rounded-full bg-slate-100 animate-pulse" />
          </div>
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, r) => (
        <div key={r} className="grid grid-cols-7 border-b border-slate-100 last:border-b-0">
          {Array.from({ length: 7 }).map((__, c) => (
            <div key={c} className="px-3 py-3 min-h-[88px]">
              <div className="h-full w-full rounded-md bg-slate-50 animate-pulse" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
