"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DataTable, DataTableColumn, RowAction, Badge, DataState, TableSkeleton } from "../../../components/ui";
import { useTimetable } from "../hooks/useTimetable";
import { TimetableRecord, getDayLabel } from "../types/timetable.types";
import { showToast } from "../../../utils/toast";

export function TimetableListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, deleteTimetable, refresh } = useTimetable();
  const [selectedClass, setSelectedClass] = useState<string>(searchParams.get("class_id") || "");

  useEffect(() => {
    const classId = searchParams.get("class_id");
    if (classId) setSelectedClass(classId);
  }, [searchParams]);

  const columns: DataTableColumn<TimetableRecord>[] = useMemo(() => [
    {
      key: "day_of_week",
      label: "Day / Type",
      render: (row) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-[11px]">{getDayLabel(row.day_of_week)}</span>
          <Badge variant={row.is_class_schedule ? "primary" : "secondary"} className="text-[8px] h-4 px-1.5 font-bold uppercase tracking-tighter">
            {row.is_class_schedule ? "Class Schedule" : "Registry Record"}
          </Badge>
        </div>
      ),
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
      hidden: (row: TimetableRecord) => !!row.is_class_schedule,
      confirmTitle: "Delete Timetable Entry",
      confirmMessage: (row: TimetableRecord) => `Delete ${row.class_name} - ${row.subject_name} on ${getDayLabel(row.day_of_week)}?`,
      onClick: async (row: TimetableRecord) => {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4 py-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-slate-900 normal-case ">Schedule Registry</h2>
          <p className="text-[10px] font-bold text-slate-500 normal-case tracking-tight">Data-grid view of all institutional sessions</p>
        </div>
        <button 
          onClick={() => router.push('/admin/timetable/create')}
          className="h-9 px-5 bg-blue-600 text-white rounded-lg text-[10px] font-bold normal-case  hover:bg-blue-700 transition-all shadow-md active:scale-95"
        >
          + New Record
        </button>
      </div>

      <div className="premium-card p-0 overflow-hidden border-slate-200/60 bg-white shadow-xl shadow-slate-200/40 rounded-3xl">
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row._id}
          searchable
          searchKeys={["class_name", "subject_name", "teacher_name", "room", "day_of_week"]}
          sortable
          paginated={15}
          rowActions={rowActions}
          emptyState={{ 
            title: "Registry Empty", 
            description: "No historical timetable records found in the database." 
          }}
        />
      </div>
    </div>
  );
}
