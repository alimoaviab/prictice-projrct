"use client";

import { useMemo, useState } from "react";
import { DataTable, DataTableColumn, RowAction, Badge, DataState, TableSkeleton } from "../../../components/ui";
import { useTimetable } from "../hooks/useTimetable";
import { TimetableRecord, getDayLabel } from "../types/timetable.types";
import { showToast } from "../../../utils/toast";

export function TimetableListPage() {
  const { state, deleteTimetable, refresh } = useTimetable();
  const [selectedClass, setSelectedClass] = useState<string>("");

  const columns: DataTableColumn<TimetableRecord>[] = useMemo(() => [
    {
      key: "day_of_week",
      label: "Day",
      render: (row) => <span className="font-medium">{getDayLabel(row.day_of_week)}</span>,
      sortable: true,
    },
    {
      key: "class",
      label: "Class",
      render: (row) => <span className="font-semibold">{row.class_name}</span>,
    },
    {
      key: "subject",
      label: "Subject",
      render: (row) => <span>{row.subject_name}</span>,
    },
    {
      key: "teacher",
      label: "Teacher",
      render: (row) => <span className="text-gray-600">{row.teacher_name}</span>,
    },
    {
      key: "time",
      label: "Time",
      render: (row) => <span className="text-sm text-gray-500">{row.start_time} - {row.end_time}</span>,
    },
    {
      key: "room",
      label: "Room",
      render: (row) => <Badge variant="secondary">{row.room || "—"}</Badge>,
    },
  ], []);

  const rowActions: RowAction<TimetableRecord>[] = useMemo(() => [
    {
      icon: "delete",
      label: "Delete",
      variant: "danger",
      requireConfirm: true,
      confirmTitle: "Delete Timetable Entry",
      confirmMessage: (row) => `Delete ${row.class_name} - ${row.subject_name} on ${getDayLabel(row.day_of_week)}?`,
      onClick: async (row) => {
        const result: any = await deleteTimetable(row._id);
        if (!result.ok) showToast(result.message || result.error?.message || "Failed to delete", "error");
      },
    },
  ], [deleteTimetable]);

  if (state.status === "loading" || state.status === "idle") {
    return <TableSkeleton />;
  }

  if (state.status === "error") {
    return <DataTable columns={columns} rows={[]} error={state.error} onRetry={refresh} />;
  }

  const rows = selectedClass ? (state.data || []).filter(r => r.class_id === selectedClass) : (state.data || []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Timetable List</h2>
          <p className="text-sm text-gray-500">View and manage class schedules</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row._id}
        searchable
        searchKeys={["class_name", "subject_name", "teacher_name", "room", "day_of_week"]}
        sortable
        paginated={15}
        rowActions={rowActions}
        emptyState={{ title: "No timetable entries", description: "Add class schedule entries." }}
      />
    </div>
  );
}
