"use client";

import { useState } from "react";
import Link from "next/link";
import { DataTable, DataTableColumn, RowAction, Badge, DataState, Skeleton, TableSkeleton } from "../../../components/ui";
import { useStudents } from "../hooks/useStudents";
import { StudentRow } from "../types/student.types";
import { showToast } from "../../../utils/toast";

export function StudentListPage() {
  const { state } = useStudents();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const columns: DataTableColumn<StudentRow>[] = [
    {
      key: "admission_no",
      label: "Admission No",
      render: (row) => <span className="font-mono text-xs text-gray-500">{row.admission_no}</span>,
    },
    {
      key: "name",
      label: "Name",
      render: (row) => <span className="font-semibold text-gray-900">{row.first_name} {row.last_name}</span>,
      sortable: true,
      sortFn: (a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`),
    },
    {
      key: "class",
      label: "Class / Section",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="text-gray-700">{row.class_id}</span>
          <Badge variant="secondary">{row.section}</Badge>
        </div>
      ),
    },
    {
      key: "guardian",
      label: "Guardian",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">{row.guardian.name}</span>
          <span className="text-xs text-gray-400">{row.guardian.phone}</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge variant={row.status === "active" ? "success" : "gray"} className="capitalize">
          {row.status}
        </Badge>
      ),
    },
  ];

  const rowActions: RowAction<StudentRow>[] = [
    {
      icon: "visibility",
      label: "View Details",
      variant: "primary",
      onClick: (row) => {
        alert(`Student: ${row.first_name} ${row.last_name}\nAdmission: ${row.admission_no}\nGuardian: ${row.guardian.name} (${row.guardian.phone})`);
      },
    },
    {
      icon: "edit",
      label: "Edit Student",
      variant: "ghost",
      onClick: () => showToast("Edit feature coming soon", "info"),
    },
    {
      icon: "delete",
      label: "Delete Student",
      variant: "danger",
      requireConfirm: true,
      confirmTitle: "Delete Student",
      confirmMessage: (row: StudentRow) => `Are you sure you want to delete ${row.first_name} ${row.last_name}?`,
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
    return <DataState variant="error" title="Failed to load students" message={state.error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Student Directory</h2>
          <p className="text-sm text-gray-500">Manage all student records</p>
        </div>
        <Link
          href="/admin/students/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-600/25 active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Add Student
        </Link>
      </div>

      <DataTable
        columns={columns}
        rows={state.data || []}
        rowKey={(row) => row._id}
        searchable
        searchKeys={["admission_no", "first_name", "last_name", "class_id", "section"]}
        sortable
        paginated={10}
        rowActions={rowActions}
        emptyState={{
          title: "No students found",
          description: "Get started by adding your first student record.",
          action: { label: "Add Student", href: "/admin/students/create" },
        }}
      />
    </div>
  );
}
