"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DataTable, DataTableColumn, RowAction, Badge, DataState, Skeleton, TableSkeleton } from "../../../components/ui";
import { useExams } from "../hooks/useExams";
import { ExamRow } from "../types/exam.types";
import { showToast } from "../../../utils/toast";

export function ExamListPage({ filters }: { filters?: { class_id?: string; subject?: string } }) {
  const pathname = usePathname();
  const { state, updateExam, deleteExam } = useExams(filters);

  const columns: DataTableColumn<ExamRow>[] = [
    {
      key: "title",
      label: "Exam",
      render: (row) => (
        <div>
          <div className="font-semibold text-gray-900">{row.title}</div>
          <div className="text-xs text-gray-400">{row.subject}</div>
        </div>
      ),
      sortable: true,
      sortFn: (a, b) => a.title.localeCompare(b.title),
    },
    {
      key: "class",
      label: "Class",
      render: (row) => <span className="text-sm text-gray-600">{row.class_name || row.class_id}</span>,
    },
    {
      key: "date",
      label: "Date",
      render: (row) => <span className="text-sm text-gray-600">{row.starts_at}</span>,
    },
    {
      key: "marks",
      label: "Max Marks",
      render: (row) => <span className="text-sm font-medium text-gray-700">{row.max_marks}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge
          variant={
            row.status === "scheduled" ? "primary" : row.status === "completed" ? "success" : "error"
          }
          className="capitalize"
        >
          {row.status}
        </Badge>
      ),
    },
  ];

  const rowActions: RowAction<ExamRow>[] = [
    {
      icon: "visibility",
      label: "View Details",
      variant: "primary",
      onClick: (row) => {
        // Could navigate to detail page or show modal
        alert(`Exam: ${row.title}\nSubject: ${row.subject}\nDate: ${row.starts_at}\n\nDescription: ${row.description || "No description"}`);
      },
    },
    {
      icon: "edit",
      label: "Edit Exam",
      variant: "ghost",
      onClick: async (row) => {
        const title = window.prompt("Exam title", row.title)?.trim();
        if (!title) {
          return;
        }
        const status = window.prompt("Status (scheduled/completed/cancelled)", row.status)?.trim();
        if (!status) {
          return;
        }
        await updateExam(row._id, {
          title,
          status: status as ExamRow["status"]
        });
      },
    },
    {
      icon: "delete",
      label: "Delete Exam",
      variant: "danger",
      requireConfirm: true,
      confirmTitle: "Delete Exam",
      confirmMessage: (row: ExamRow) => `Are you sure you want to delete "${row.title}"? This action cannot be undone.`,
      onClick: async (row) => {
        const result = await deleteExam(row._id);
        if (!result.ok) {
          showToast(result.error.message || "Failed to delete exam", "error");
        }
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
    return <DataState variant="error" title="Failed to load exams" message={state.error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Scheduled Exams</h2>
          <p className="text-sm text-gray-500">Manage all examination schedules</p>
        </div>
        {!pathname.includes("/parent") && (
          <Link
            href={pathname.includes("/teacher") ? "/teacher/exams/create" : "/admin/exams/create"}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-600/25 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Schedule Exam
          </Link>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={state.data || []}
        rowKey={(row) => row._id}
        searchable
        searchKeys={["title", "subject", "class_name", "class_id"]}
        sortable
        paginated={10}
        rowActions={pathname.includes("/parent") ? rowActions.filter(a => a.label === "View Details") : rowActions}
        emptyState={{
          title: "No exams scheduled",
          description: "Get started by creating your first examination schedule.",
          action: { label: "Schedule Exam", href: pathname.includes("/teacher") ? "/teacher/exams/create" : "/admin/exams/create" },
        }}
      />
    </div>
  );
}
