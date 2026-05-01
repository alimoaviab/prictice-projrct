"use client";

import { useState } from "react";
import Link from "next/link";
import { DataTable, DataTableColumn, RowAction, Badge, DataState, Skeleton, TableSkeleton } from "../../../components/ui";
import { useAttendance } from "../hooks/useAttendance";
import { AttendanceRecordRow } from "../types/attendance.types";
import { showToast } from "../../../utils/toast";

export function AttendanceListPage() {
  const { state } = useAttendance();
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
      onClick: () => showToast("Edit feature coming soon", "info"),
    },
    {
      icon: "delete",
      label: "Delete Record",
      variant: "danger",
      requireConfirm: true,
      confirmTitle: "Delete Attendance Record",
      confirmMessage: (row: AttendanceRecordRow) => 
        `Are you sure you want to delete attendance for ${row.student_name} on ${new Date(row.date).toLocaleDateString()}?`,
      onClick: (row) => {
        setDeleteId(row._id);
        showToast("Delete feature coming soon", "info");
        setDeleteId(null);
      },
    },
  ];

  if (state.status === "loading" || state.status === "idle") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
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
        <Link
          href="/admin/attendance/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-600/25 active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Mark Attendance
        </Link>
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
