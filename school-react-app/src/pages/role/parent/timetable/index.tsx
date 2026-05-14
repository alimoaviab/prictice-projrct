import { SchoolShell } from "@/layouts/SchoolShell";
import { TimetableGrid } from "@/modules/timetable/components/TimetableGrid";
import { useTimetable } from "@/modules/timetable/hooks/useTimetable";
import { TableSkeleton, DataState } from "@/components/ui";
import { useSelectedChild } from "@/contexts/SelectedChildContext";

export function ParentTimetablePage() {
  const { selectedChild, loading: childLoading } = useSelectedChild();
  const { state } = useTimetable(selectedChild?.class_id ? { class_id: selectedChild.class_id } : undefined);

  if (childLoading) {
    return (
      <SchoolShell eyebrow="Guardian Portal" title="Weekly Schedule">
        <div className="space-y-4">
          <div className="h-16 w-full rounded-2xl bg-slate-50 animate-pulse" />
          <TableSkeleton />
        </div>
      </SchoolShell>
    );
  }

  if (!selectedChild) {
    return (
      <SchoolShell eyebrow="Guardian Portal" title="Weekly Schedule">
        <DataState variant="empty" title="No Student Selected" message="Please select a student to view their academic schedule." />
      </SchoolShell>
    );
  }

  return (
    <SchoolShell eyebrow="Guardian Portal" title="Weekly Schedule">
      <div className="space-y-6">
        {/* Compact Schedule Header */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Academic Timeline</p>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Weekly Class Distribution</h2>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100">
             <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
             <span className="text-[11px] font-black text-blue-600 uppercase tracking-tight">Active Session</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-2">
          {state.status === "loading" && <TableSkeleton />}
          {state.status === "error" && <DataState variant="error" title="Schedule Sync Error" message={state.error} />}

          {state.status === "success" && (
            <TimetableGrid
              records={state.data || []}
            />
          )}
        </div>
      </div>
    </SchoolShell>
  );
}
