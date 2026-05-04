"use client";

import React from "react";
import Link from "next/link";
import { DataTable, DataTableColumn, RowAction, Badge, DataState, Skeleton, TableSkeleton, Select } from "../../../components/ui";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { serviceRequest } from "../../../services/service-client";
import { useRouter } from "next/navigation";
import { useAttendance } from "../hooks/useAttendance";
import { AttendanceRecordRow } from "../types/attendance.types";
import { showToast } from "../../../utils/toast";

export function AttendanceListPage() {
  const { state, updateAttendance, deleteAttendance } = useAttendance();
  const { state: classState, run: runClasses } = useSafeAsync<Array<{ _id: string; name: string }>>();
  const router = useRouter();

  const loadClasses = () =>
    runClasses(async () => {
      const res = await serviceRequest<Array<{ _id: string; name: string }>>("/api/classes");
      if (!res.ok) throw new Error(res.error.message || "Failed to load classes");
      return res.data;
    });

  React.useEffect(() => {
    void loadClasses().catch(() => { });
  }, []);

  const classOptions = (classState.data ?? []).map((c) => ({ id: c._id, label: c.name }));
  const [selectedClass, setSelectedClass] = React.useState("");

  const columns: DataTableColumn<AttendanceRecordRow>[] = [
    {
      key: "date",
      label: "Date",
      render: (row) => (
        <span className="text-sm text-gray-600">{new Date(row.date).toLocaleDateString()}</span>
      ),
      sortable: true,
      sortFn: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      key: "student",
      label: "Student",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{row.student_name}</span>
          <span className="text-xs text-gray-500">{row.admission_no}</span>
        </div>
      ),
      sortable: true,
      sortFn: (a, b) => a.student_name.localeCompare(b.student_name),
    },
    {
      key: "class",
      label: "Class",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">{row.class_name}</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge
          variant={
            row.status === "present" ? "success" :
              row.status === "absent" ? "error" :
                row.status === "late" ? "warning" : "gray"
          }
          className="capitalize"
        >
          {row.status}
        </Badge>
      ),
    },
    {
      key: "note",
      label: "Note",
      render: (row) => (
        <span className="text-sm text-gray-500 italic">{row.note || "—"}</span>
      ),
    },
  ];

  const rowActions: RowAction<AttendanceRecordRow>[] = [
    {
      icon: "visibility",
      label: "View Details",
      variant: "primary",
      onClick: (row) => {
        alert(`Student: ${row.student_name}\nDate: ${row.date}\nStatus: ${row.status}\nNote: ${row.note || "N/A"}`);
      },
    },
    {
      icon: "edit",
      label: "Edit Record",
      variant: "ghost",
      onClick: async (row) => {
        const status = window.prompt("Status (present/absent/late/excused)", row.status)?.trim();
        if (!status) {
          return;
        }
        const note = window.prompt("Note", row.note || "")?.trim() || "";
        await updateAttendance(row._id, {
          status: status as AttendanceRecordRow["status"],
          note
        });
      },
    },
    {
      icon: "delete",
      label: "Delete Record",
      variant: "danger",
      requireConfirm: true,
      confirmTitle: "Delete Attendance Record",
      confirmMessage: (row: AttendanceRecordRow) =>
        `Are you sure you want to delete attendance for ${row.student_name} on ${new Date(row.date).toLocaleDateString()}?`,
      onClick: async (row) => {
        const result = await deleteAttendance(row._id);
        if (!result.ok) {
          showToast(result.error.message || "Failed to delete attendance", "error");
        }
      },
    },
  ];

  if (state.status === "loading" || state.status === "idle") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-40 w-40" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <TableSkeleton />
      </div>
    );
  }

  if (state.status === "error") {
    return <DataState variant="error" title="Failed to load attendance" message={state.error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Attendance Records</h2>
          <p className="text-sm text-gray-500">Track student daily attendance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            label="Open class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            options={[{ label: "Select class", value: "" }, ...classOptions.map(c => ({ label: c.label, value: c.id }))]}
          />
          <button
            onClick={() => router.push(`/admin/attendance/create?class_id=${selectedClass}`)}
            disabled={!selectedClass}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all"
          >
            <span className="material-symbols-outlined text-lg">open_in_new</span>
            Open Class
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={state.data || []}
        rowKey={(row) => row._id}
        searchable
        searchKeys={["student_name", "admission_no", "class_name", "status", "note"]}
        sortable
        paginated={10}
        rowActions={rowActions}
        emptyState={{
          title: "No attendance records",
          description: "Start marking attendance for your classes.",
          action: { label: "Mark Attendance", href: "/admin/attendance/create" },
        }}
      />
    </div>
  );
}
