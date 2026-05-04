"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DataTable,
  DataTableColumn,
  RowAction,
  Badge,
  DataState,
  TableSkeleton,
} from "../../../components/ui";
import { useBehavior } from "../hooks/useBehavior";
import { BehaviorRecordRow } from "../types/behavior.types";
import { showToast } from "../../../utils/toast";

export function BehaviorListPage({ filters }: { filters?: { student_id?: string; teacher_id?: string; status?: string } }) {
  const pathname = usePathname();
  const { state, deleteBehavior } = useBehavior(filters);

  const handleDelete = async (id: string) => {
    const result = await deleteBehavior(id);
    if (!result.success) {
      showToast(result.message || "Failed to delete record", "error");
    } else {
      showToast("Record deleted", "success");
    }
  };

  const columns: DataTableColumn<BehaviorRecordRow>[] = useMemo(() => [
    {
      key: "student",
      label: "Student",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{row.student_name}</span>
          <span className="text-xs text-gray-500">{row.class_name}</span>
        </div>
      ),
      sortable: true,
      sortFn: (a, b) => a.student_name.localeCompare(b.student_name),
    },
    {
      key: "incident_type",
      label: "Type",
      render: (row) => <span className="capitalize">{row.incident_type.replace("_", " ")}</span>,
      sortable: true,
    },
    {
      key: "severity",
      label: "Severity",
      render: (row) => (
        <Badge
          variant={
            row.severity === "critical" ? "error" :
            row.severity === "major" ? "warning" :
            row.severity === "moderate" ? "primary" :
            "success"
          }
          className="capitalize"
        >
          {row.severity}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge
          variant={
            row.status === "resolved" ? "success" :
            row.status === "open" ? "warning" :
            row.status === "under_review" ? "primary" :
            "error"
          }
          className="capitalize"
        >
          {row.status.replace("_", " ")}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: "warnings",
      label: "Warnings",
      render: (row) => <span>{row.warning_count}</span>,
      sortable: true,
    },
    {
      key: "parent_notified",
      label: "Parent Notified",
      render: (row) => (
        <Badge variant={row.parent_notified ? "success" : "gray"}>
          {row.parent_notified ? "Yes" : "No"}
        </Badge>
      ),
    },
  ], []);

  const rowActions: RowAction<BehaviorRecordRow>[] = useMemo(() => [
    {
      icon: "visibility",
      label: "View Details",
      variant: "primary",
      onClick: (row) => {
        alert(`Record: ${row.title}\nType: ${row.incident_type}\nSeverity: ${row.severity}\nDate: ${row.date}\n\nDescription: ${row.description || "N/A"}`);
      },
    },
    {
      icon: "delete",
      label: "Delete",
      variant: "danger",
      requireConfirm: true,
      confirmTitle: "Delete Record",
      confirmMessage: (row) => `Are you sure you want to delete the behavior record for ${row.student_name}?`,
      onClick: (row) => handleDelete(row._id),
    },
  ], [pathname]);

  if (state.status === "loading" && !state.data) {
    return <TableSkeleton />;
  }

  if (state.status === "error") {
    return <DataState variant="error" title="Error Loading Behavior Records" message={state.error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Student Behavior</h2>
          <p className="text-sm text-gray-500">Monitor and record student discipline and achievements</p>
        </div>
        {!pathname.includes("/parent") && (
          <Link
            href={pathname.includes("/teacher") ? "/teacher/behavior/create" : "/admin/behavior/create"}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-600/25 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add Record
          </Link>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={state.data || []}
        rowKey={(row) => row._id}
        searchable
        searchKeys={["student_name", "class_name", "incident_type", "severity", "status"]}
        sortable
        paginated={10}
        rowActions={pathname.includes("/parent") ? rowActions.filter(a => a.label === "View Details") : rowActions}
        emptyState={{
          title: "No behavior records",
          description: "Start by adding a new behavior record for a student.",
          action: { label: "Add Record", href: pathname.includes("/teacher") ? "/teacher/behavior/create" : "/admin/behavior/create" }
        }}
      />
    </div>
  );
}
