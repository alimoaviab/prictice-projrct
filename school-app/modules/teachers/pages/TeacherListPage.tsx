"use client";

import { useState } from "react";
import Link from "next/link";
import { DataTable, DataTableColumn, RowAction, Badge, DataState, Skeleton, TableSkeleton } from "../../../components/ui";
import { useTeachers } from "../hooks/useTeachers";
import { TeacherRow } from "../types/teacher.types";
import { showToast } from "../../../utils/toast";

export function TeacherListPage() {
  const { state } = useTeachers();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const columns: DataTableColumn<TeacherRow>[] = [
    {
      key: "employee_no",
      label: "Employee No",
      render: (row) => <span className="font-mono text-xs text-gray-500">{row.employee_no}</span>,
    },
    {
      key: "name",
      label: "Name",
      render: (row) => <span className="font-semibold text-gray-900">{row.first_name} {row.last_name}</span>,
      sortable: true,
      sortFn: (a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`),
    },
    {
      key: "email",
      label: "Email",
      render: (row) => <span className="text-sm text-gray-600">{row.email}</span>,
    },
    {
      key: "phone",
      label: "Phone",
      render: (row) => <span className="text-sm text-gray-600">{row.phone}</span>,
    },
    {
      key: "qualification",
      label: "Qualification",
      render: (row) => <span className="text-sm text-gray-600">{row.qualification || "—"}</span>,
    },
    {
      key: "subjects",
      label: "Subjects",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.subjects.slice(0, 2).map((s) => (
            <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
          ))}
          {row.subjects.length > 2 && (
            <Badge variant="secondary" className="text-[10px]">+{row.subjects.length - 2}</Badge>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge
          variant={row.status === "active" ? "success" : row.status === "on_leave" ? "warning" : "gray"}
          className="capitalize"
        >
          {row.status.replace("_", " ")}
        </Badge>
      ),
    },
  ];

  const rowActions: RowAction<TeacherRow>[] = [
    {
      icon: "visibility",
      label: "View Details",
      variant: "primary",
      onClick: (row) => {
        alert(`Teacher: ${row.first_name} ${row.last_name}\nEmployee No: ${row.employee_no}\nSubjects: ${row.subjects.join(", ")}\nClasses: ${row.class_ids?.join(", ") || "None"}`);
      },
    },
    {
      icon: "edit",
      label: "Edit Teacher",
      variant: "ghost",
      onClick: () => showToast("Edit feature coming soon", "info"),
    },
    {
      icon: "delete",
      label: "Delete Teacher",
      variant: "danger",
      requireConfirm: true,
      confirmTitle: "Delete Teacher",
      confirmMessage: (row: TeacherRow) => `Are you sure you want to delete ${row.first_name} ${row.last_name}?`,
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
    return <DataState variant="error" title="Failed to load teachers" message={state.error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Teacher Directory</h2>
          <p className="text-sm text-gray-500">Manage all teaching staff</p>
        </div>
        <Link
          href="/admin/teachers/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-600/25 active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Add Teacher
        </Link>
      </div>

      <DataTable
        columns={columns}
        rows={state.data || []}
        rowKey={(row) => row._id}
        searchable
        searchKeys={["employee_no", "first_name", "last_name", "email", "phone", "qualification"]}
        sortable
        paginated={10}
        rowActions={rowActions}
        emptyState={{
          title: "No teachers found",
          description: "Get started by adding your first teacher.",
          action: { label: "Add Teacher", href: "/admin/teachers/create" },
        }}
      />
    </div>
  );
}
