"use client";

import { useState } from "react";
import Link from "next/link";
import { DataTable, DataTableColumn, RowAction, Badge, DataState, Skeleton, TableSkeleton } from "../../../components/ui";
import { useAcademicYears } from "../hooks/useAcademicYears";
import { AcademicYearRow } from "../types/academicYear.types";
import { showToast } from "../../../utils/toast";

export function AcademicYearListPage() {
  const { state } = useAcademicYears();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const columns: DataTableColumn<AcademicYearRow>[] = [
    {
      key: "year",
      label: "Academic Year",
      render: (row) => <span className="font-semibold text-gray-900">{row.year}</span>,
      sortable: true,
      sortFn: (a, b) => a.year.localeCompare(b.year),
    },
    {
      key: "start_date",
      label: "Start Date",
      render: (row) => (
        <span className="text-sm text-gray-600">
          {row.start_date ? new Date(row.start_date).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "end_date",
      label: "End Date",
      render: (row) => (
        <span className="text-sm text-gray-600">
          {row.end_date ? new Date(row.end_date).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "active",
      label: "Active",
      render: (row) => (
        <Badge variant={row.is_active ? "success" : "gray"} className="capitalize">
          {row.is_active ? "Active" : "Inactive"}
        </Badge>
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

  const rowActions: RowAction<AcademicYearRow>[] = [
    {
      icon: "visibility",
      label: "View Details",
      variant: "primary",
      onClick: (row) => {
        alert(`Year: ${row.year}\nStart: ${row.start_date || "N/A"}\nEnd: ${row.end_date || "N/A"}\nDescription: ${row.description || "No description"}`);
      },
    },
    {
      icon: "edit",
      label: "Edit Year",
      variant: "ghost",
      onClick: () => showToast("Edit feature coming soon", "info"),
    },
    {
      icon: "delete",
      label: "Delete Year",
      variant: "danger",
      requireConfirm: true,
      confirmTitle: "Delete Academic Year",
      confirmMessage: (row: AcademicYearRow) => `Are you sure you want to delete ${row.year}?`,
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
    return <DataState variant="error" title="Failed to load academic years" message={state.error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Academic Years</h2>
          <p className="text-sm text-gray-500">Manage school academic sessions</p>
        </div>
        <Link
          href="/admin/academic-years/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-600/25 active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Add Year
        </Link>
      </div>

      <DataTable
        columns={columns}
        rows={state.data || []}
        rowKey={(row) => row._id}
        searchable
        searchKeys={["year", "description"]}
        sortable
        paginated={10}
        rowActions={rowActions}
        emptyState={{
          title: "No academic years found",
          description: "Get started by creating the first academic year.",
          action: { label: "Add Academic Year", href: "/admin/academic-years/create" },
        }}
      />
    </div>
  );
}
