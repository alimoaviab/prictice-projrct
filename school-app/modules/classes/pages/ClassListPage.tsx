"use client";

import { useState } from "react";
import Link from "next/link";
import { DataTable, DataTableColumn, RowAction, Badge, DataState, Skeleton, TableSkeleton } from "../../../components/ui";
import { useClasses } from "../hooks/useClasses";
import { ClassRow } from "../types/class.types";
import { showToast } from "../../../utils/toast";

export function ClassListPage() {
  const { state } = useClasses();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const columns: DataTableColumn<ClassRow>[] = [
    {
      key: "name",
      label: "Class Name",
      render: (row) => <span className="font-semibold text-gray-900">{row.name}</span>,
      sortable: true,
      sortFn: (a, b) => a.name.localeCompare(b.name),
    },
    {
      key: "academic_year",
      label: "Academic Year",
      render: (row) => <span className="text-sm text-gray-600">{row.academy_care_year || row.academy_care_id}</span>,
    },
    {
      key: "room",
      label: "Room",
      render: (row) => <span className="text-sm text-gray-600">{row.room_number || "—"}</span>,
    },
    {
      key: "teachers",
      label: "Teachers",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {(row.teacher_names || row.teacher_ids || []).slice(0, 2).map((t, i) => (
            <Badge key={i} variant="secondary" className="text-[10px]">{t}</Badge>
          ))}
          {(row.teacher_names || row.teacher_ids || []).length > 2 && (
            <Badge variant="secondary" className="text-[10px]">+{(row.teacher_names || row.teacher_ids || []).length - 2}</Badge>
          )}
        </div>
      ),
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
        <Badge variant={row.status === "active" ? "success" : "gray"} className="capitalize">
          {row.status}
        </Badge>
      ),
    },
  ];

  const rowActions: RowAction<ClassRow>[] = [
    {
      icon: "visibility",
      label: "View Details",
      variant: "primary",
      onClick: (row) => {
        alert(`Class: ${row.name}\nRoom: ${row.room_number || "N/A"}\nDescription: ${row.description || "No description"}`);
      },
    },
    {
      icon: "edit",
      label: "Edit Class",
      variant: "ghost",
      onClick: () => showToast("Edit feature coming soon", "info"),
    },
    {
      icon: "delete",
      label: "Delete Class",
      variant: "danger",
      requireConfirm: true,
      confirmTitle: "Delete Class",
      confirmMessage: (row: ClassRow) => `Are you sure you want to delete ${row.name}?`,
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
    return <DataState variant="error" title="Failed to load classes" message={state.error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Classes</h2>
          <p className="text-sm text-gray-500">Manage all classrooms and sections</p>
        </div>
        <Link
          href="/admin/classes/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-600/25 active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Add Class
        </Link>
      </div>

      <DataTable
        columns={columns}
        rows={state.data || []}
        rowKey={(row) => row._id}
        searchable
        searchKeys={["name", "academy_care_year", "room_number", "description"]}
        sortable
        paginated={10}
        rowActions={rowActions}
        emptyState={{
          title: "No classes found",
          description: "Get started by creating your first class.",
          action: { label: "Add Class", href: "/admin/classes/create" },
        }}
      />
    </div>
  );
}
