import { Badge, DataTable } from "@/components/ui";
import { AnnouncementRecordRow } from "../types/announcement.types";

export function AnnouncementTable({ rows }: { rows: AnnouncementRecordRow[] }) {
    const columns = [
        {
            key: "priority",
            label: "Priority",
            render: (row: AnnouncementRecordRow) => {
                const variants: Record<string, any> = {
                    urgent: "error",
                    high: "warning",
                    normal: "secondary",
                    low: "gray"
                };
                return <Badge variant={variants[row.priority] || "gray"} className="normal-case">{row.priority}</Badge>;
            }
        },
        {
            key: "title",
            label: "Title",
            render: (row: AnnouncementRecordRow) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">{row.title}</span>
                    <span className="text-xs text-gray-500 max-w-[300px] truncate">{row.content}</span>
                </div>
            )
        },
        {
            key: "target",
            label: "Target",
            render: (row: AnnouncementRecordRow) => (
                <Badge variant="gray" className="normal-case">{row.target_type}</Badge>
            )
        },
        {
            key: "status",
            label: "Status",
            render: (row: AnnouncementRecordRow) => {
                const variants: Record<string, any> = {
                    published: "success",
                    draft: "warning",
                    archived: "gray"
                };
                return <Badge variant={variants[row.status] || "gray"} className="normal-case">{row.status}</Badge>;
            }
        },
        {
            key: "created",
            label: "Created",
            render: (row: AnnouncementRecordRow) => (
                <div className="text-sm text-gray-500">
                    {row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}
                </div>
            )
        }
    ];

    return <DataTable columns={columns} rows={rows} />;
}
