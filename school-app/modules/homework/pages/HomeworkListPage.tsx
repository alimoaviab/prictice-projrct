"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DataTable, DataTableColumn, RowAction, Badge, DataState, Skeleton, TableSkeleton } from "../../../components/ui";
import { useHomework } from "../hooks/useHomework";
import { HomeworkRecordRow } from "../types/homework.types";
import { showToast } from "../../../utils/toast";

export function HomeworkListPage({ filters }: { filters?: { class_id?: string; teacher_id?: string } }) {
  const pathname = usePathname();
  const { state, updateHomework, deleteHomework } = useHomework(filters);

  const columns: DataTableColumn<HomeworkRecordRow>[] = [
    {
      key: "title",
      label: "Title",
      render: (row) => <span className="font-semibold text-gray-900">{row.title}</span>,
      sortable: true,
      sortFn: (a, b) => a.title.localeCompare(b.title),
    },
    {
      key: "subject",
      label: "Subject",
      render: (row) => <span className="text-sm text-gray-600">{row.subject_name}</span>,
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
      key: "teacher",
      label: "Assigned By",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">{row.teacher_name}</span>
          <span className="text-xs text-gray-500">{row.teacher_employee_no}</span>
        </div>
      ),
    },
    {
      key: "due",
      label: "Due Date",
      render: (row) => (
        <span className="text-sm text-gray-600">
          {new Date(row.due_at).toLocaleDateString()}
        </span>
      ),
      sortable: true,
      sortFn: (a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime(),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge
          variant={
            row.status === "assigned" ? "success" :
              row.status === "draft" ? "warning" : "gray"
          }
          className="capitalize"
        >
          {row.status}
        </Badge>
      ),
    },
  ];

  const rowActions: RowAction<HomeworkRecordRow>[] = [
    {
      icon: "visibility",
      label: "View Details",
      variant: "primary",
      onClick: (row) => {
        alert(`Title: ${row.title}\nSubject: ${row.subject}\nInstructions: ${row.instructions || "No instructions"}\nDue: ${row.due_at}`);
      },
    },
    {
      icon: "edit",
      label: "Edit Homework",
      variant: "ghost",
      onClick: async (row) => {
        const title = window.prompt("Title", row.title)?.trim();
        if (!title) {
          return;
        }
        const instructions = window.prompt("Instructions", row.instructions || "")?.trim() || "";
        await updateHomework(row._id, { title, instructions });
      },
    },
    {
      icon: "delete",
      label: "Delete Homework",
      variant: "danger",
      requireConfirm: true,
      confirmTitle: "Delete Homework",
      confirmMessage: (row: HomeworkRecordRow) => `Are you sure you want to delete ${row.title}?`,
      onClick: async (row) => {
        const result = await deleteHomework(row._id);
        if (!result.ok) {
          showToast(result.error.message || "Failed to delete homework", "error");
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
    return <DataState variant="error" title="Failed to load homework" message={state.error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Homework Assignments</h2>
          <p className="text-sm text-gray-500">Manage all homework and assignments</p>
        </div>
        {!pathname.includes("/parent") && (
          <Link
            href={pathname.includes("/teacher") ? "/teacher/homework/create" : "/admin/homework/create"}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-600/25 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add Homework
          </Link>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={state.data || []}
        rowKey={(row) => row._id}
        searchable
        searchKeys={["title", "subject_name", "class_name", "teacher_name", "status"]}
        sortable
        paginated={10}
        rowActions={pathname.includes("/parent") ? rowActions.filter(a => a.label === "View Details") : rowActions}
        emptyState={{
          title: "No homework assigned",
          description: "Create homework for your classes.",
          action: { label: "Add Homework", href: pathname.includes("/teacher") ? "/teacher/homework/create" : "/admin/homework/create" },
        }}
      />
    </div>
  );
}
