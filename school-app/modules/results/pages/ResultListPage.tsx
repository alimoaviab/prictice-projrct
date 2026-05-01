"use client";

import { useState } from "react";
import Link from "next/link";
import { DataTable, DataTableColumn, RowAction, Badge, DataState, Skeleton, TableSkeleton } from "../../../components/ui";
import { useResults } from "../hooks/useResults";
import { ResultRow } from "../types/result.types";
import { showToast } from "../../../utils/toast";

export function ResultListPage() {
  const { state } = useResults();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const columns: DataTableColumn<ResultRow>[] = [
    {
      key: "exam",
      label: "Exam",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{row.exam_title}</span>
          <span className="text-xs text-gray-500">{row.exam_subject}</span>
        </div>
      ),
      sortable: true,
      sortFn: (a, b) => a.exam_title.localeCompare(b.exam_title),
    },
    {
      key: "student",
      label: "Student",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">{row.student_name}</span>
          <span className="text-xs text-gray-500">{row.admission_no}</span>
        </div>
      ),
      sortable: true,
      sortFn: (a, b) => a.student_name.localeCompare(b.student_name),
    },
    {
      key: "class",
      label: "Class",
      render: (row) => <span className="text-sm text-gray-600">{row.class_name}</span>,
    },
    {
      key: "marks",
      label: "Marks",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">
            {row.obtained_marks} / {row.max_marks}
          </span>
          <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
            <div
              className={`h-full rounded-full ${row.obtained_marks / row.max_marks >= 0.6 ? "bg-green-500" : "bg-red-500"}`}
              style={{ width: `${(row.obtained_marks / row.max_marks) * 100}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "grade",
      label: "Grade",
      render: (row) => (
        <Badge variant={row.grade === "A" || row.grade === "A+" ? "success" : row.grade === "F" ? "error" : "primary"}>
          {row.grade}
        </Badge>
      ),
    },
    {
      key: "remarks",
      label: "Remarks",
      render: (row) => <span className="text-sm text-gray-500 italic">{row.remarks || "—"}</span>,
    },
    {
      key: "graded_at",
      label: "Graded At",
      render: (row) => (
        <span className="text-sm text-gray-600">
          {new Date(row.graded_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const rowActions: RowAction<ResultRow>[] = [
    {
      icon: "visibility",
      label: "View Details",
      variant: "primary",
      onClick: (row) => {
        alert(`Exam: ${row.exam_title}\nStudent: ${row.student_name}\nMarks: ${row.obtained_marks}/${row.max_marks}\nGrade: ${row.grade}\nRemarks: ${row.remarks || "N/A"}`);
      },
    },
    {
      icon: "edit",
      label: "Edit Result",
      variant: "ghost",
      onClick: () => showToast("Edit feature coming soon", "info"),
    },
    {
      icon: "delete",
      label: "Delete Result",
      variant: "danger",
      requireConfirm: true,
      confirmTitle: "Delete Result",
      confirmMessage: (row: ResultRow) => `Are you sure you want to delete the result for ${row.student_name} in ${row.exam_title}?`,
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
    return <DataState variant="error" title="Failed to load results" message={state.error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Exam Results</h2>
          <p className="text-sm text-gray-500">View and manage student exam results</p>
        </div>
        <Link
          href="/admin/results/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-600/25 active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Record Result
        </Link>
      </div>

      <DataTable
        columns={columns}
        rows={state.data || []}
        rowKey={(row) => row._id}
        searchable
        searchKeys={["exam_title", "exam_subject", "student_name", "admission_no", "class_name", "grade"]}
        sortable
        paginated={10}
        rowActions={rowActions}
        emptyState={{
          title: "No results available",
          description: "Enter exam results for students.",
          action: { label: "Record Result", href: "/admin/results/create" },
        }}
      />
    </div>
  );
}
