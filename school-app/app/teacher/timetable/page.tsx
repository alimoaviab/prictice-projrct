"use client";

import { SchoolShell } from "../../../layouts/SchoolShell";
import { TimetableGrid } from "../../../modules/timetable/components/TimetableGrid";
import { useTimetable } from "../../../modules/timetable/hooks/useTimetable";
import { useAuth } from "../../../hooks/useAuth";
import { TableSkeleton, DataState } from "../../../components/ui";

export default function TeacherTimetablePage() {
  const { user } = useAuth();
  const { state } = useTimetable(user?.profileId ? { teacher_id: user.profileId } : undefined);

  return (
    <SchoolShell eyebrow="Teacher Dashboard" title="My Timetable">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Your Weekly Schedule</h2>
          <p className="text-sm text-gray-500">View your assigned classes and subjects</p>
        </div>

        {state.status === "loading" && <TableSkeleton />}
        {state.status === "error" && <DataState variant="error" title="Error" message={state.error} />}

        {state.status === "success" && (
          <TimetableGrid
            records={state.data || []}
            // Teachers might only have view access here, or we can allow edit if needed
          />
        )}
      </div>
    </SchoolShell>
  );
}
