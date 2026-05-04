"use client";

import { SchoolShell } from "../../../layouts/SchoolShell";
import { TimetableGrid } from "../../../modules/timetable/components/TimetableGrid";
import { useTimetable } from "../../../modules/timetable/hooks/useTimetable";
import { useAuth } from "../../../hooks/useAuth";
import { TableSkeleton, DataState } from "../../../components/ui";

export default function ParentTimetablePage() {
  const { user } = useAuth();
  const { state } = useTimetable(user?.classId ? { class_id: user.classId } : undefined);

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
