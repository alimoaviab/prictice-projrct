"use client";

import { SchoolShell } from "../../../layouts/SchoolShell";
import { TimetableGrid } from "../../../modules/timetable/components/TimetableGrid";
import { useTimetable } from "../../../modules/timetable/hooks/useTimetable";
import { useAuth } from "../../../hooks/useAuth";
import { TableSkeleton, DataState } from "../../../components/ui";
import { useSelectedChild } from "../../../contexts/SelectedChildContext";

export default function ParentTimetablePage() {
  const { selectedChild, loading: childLoading } = useSelectedChild();
  const { state } = useTimetable(selectedChild?.class_id ? { class_id: selectedChild.class_id } : undefined);

  if (childLoading) {
    return (
      <SchoolShell eyebrow="Parent Dashboard" title="Child's Timetable">
        <TableSkeleton />
      </SchoolShell>
    );
  }

  if (!selectedChild) {
    return (
      <SchoolShell eyebrow="Parent Dashboard" title="Child's Timetable">
        <DataState variant="empty" title="No Student Selected" message="Please select a student to view their timetable." />
      </SchoolShell>
    );
  }

  return (
    <SchoolShell eyebrow="Parent Dashboard" title="Child's Timetable">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Weekly Schedule</h2>
          <p className="text-sm text-gray-500">View your child's class schedule and subject assignments</p>
        </div>

        {state.status === "loading" && <TableSkeleton />}
        {state.status === "error" && <DataState variant="error" title="Error" message={state.error} />}

        {state.status === "success" && (
          <TimetableGrid
            records={state.data || []}
          />
        )}
      </div>
    </SchoolShell>
  );
}
