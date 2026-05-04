"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DataTable, DataTableColumn, RowAction, Badge, DataState, Skeleton, TableSkeleton } from "../../../components/ui";
import { useAnnouncements } from "../hooks/useAnnouncements";
import { AnnouncementRecordRow } from "../types/announcement.types";
import { showToast } from "../../../utils/toast";

export function AnnouncementListPage() {
  const pathname = usePathname();
  const { state, updateAnnouncement, deleteAnnouncement } = useAnnouncements();

  const columns: DataTableColumn<AnnouncementRecordRow>[] = [
    {
      key: "priority",
      label: "Priority",
      render: (row) => (
        <Badge
          variant={
            row.priority === "urgent" ? "error" :
              row.priority === "high" ? "warning" :
                row.priority === "normal" ? "secondary" : "gray"
          }
          className="capitalize"
        >
          {row.priority}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: "title",
      label: "Title",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{row.title}</span>
          <span className="text-xs text-gray-500 max-w-[300px] truncate">{row.content}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "target",
      label: "Target",
      render: (row) => (
        <Badge variant="gray" className="capitalize">{row.target_type}</Badge>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge
          variant={
            row.status === "published" ? "success" :
              row.status === "draft" ? "warning" : "gray"
          }
          className="capitalize"
        >
          {row.status}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: "created",
      label: "Created",
      render: (row) => (
        <span className="text-sm text-gray-500">
          {row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}
        </span>
      ),
      sortable: true,
      sortFn: (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime(),
    },
  ];

  const rowActions: RowAction<AnnouncementRecordRow>[] = [
    {
      icon: "visibility",
      label: "View Details",
      variant: "primary",
      onClick: (row) => {
        alert(`Title: ${row.title}\nPriority: ${row.priority}\nTarget: ${row.target_type}\nStatus: ${row.status}`);
      },
    },
    {
      icon: "edit",
      label: "Edit",
      variant: "ghost",
      onClick: async (row) => {
        const status = window.prompt("Status (draft/published/archived)", row.status)?.trim();
        if (!status) return;
        const result = await updateAnnouncement(row._id, { status: status as any });
        if (!result.ok) {
          showToast(result.error.message || "Failed to update", "error");
        }
      },
    },
    {
      icon: "delete",
      label: "Delete",
      variant: "danger",
      requireConfirm: true,
      confirmTitle: "Delete Announcement",
      confirmMessage: (row: AnnouncementRecordRow) =>
        `Are you sure you want to delete "${row.title}"?`,
      onClick: async (row) => {
        const result = await deleteAnnouncement(row._id);
        if (!result.ok) {
          showToast(result.error.message || "Failed to delete", "error");
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
    return <DataState variant="error" title="Failed to load announcements" message={state.error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Announcements</h2>
          <p className="text-sm text-gray-500">School-wide announcements and notices</p>
        </div>
        {!pathname.includes("/parent") && (
          <Link
            href={pathname.includes("/teacher") ? "/teacher/announcements/create" : "/admin/announcements/create"}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-600/25 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            New Announcement
          </Link>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={state.data || []}
        rowKey={(row) => row._id}
        searchable
        searchKeys={["title", "content", "target_type", "status", "priority"]}
        sortable
        paginated={10}
        rowActions={pathname.includes("/parent") ? rowActions.filter(a => a.label === "View Details") : rowActions}
        emptyState={{
          title: "No announcements",
          description: "Create your first announcement.",
          action: { label: "New Announcement", href: pathname.includes("/teacher") ? "/teacher/announcements/create" : "/admin/announcements/create" },
        }}
      />
    </div>
  );
}
