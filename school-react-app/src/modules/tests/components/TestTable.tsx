import { AppIcon } from "shared/ui/AppIcon";
import { Badge, Card } from "@/components/ui";
import { TestRow } from "../types/test.types";

export function TestTable({ rows }: { rows: TestRow[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {rows.map((row) => (
        <Card key={row._id} className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{row.title}</h3>
              <p className="text-sm font-medium text-primary">{row.subject}</p>
            </div>
            <Badge
              variant={row.status === "scheduled" ? "primary" : row.status === "completed" ? "success" : "error"}
              className="normal-case"
            >
              {row.status}
            </Badge>
          </div>

          <div className="space-y-3 py-2 border-y border-border">
            <div className="flex justify-between text-sm">
                <span className="text-gray-400">Class</span>
                <span className="font-medium text-gray-700">{row.class_name || row.class_id}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-gray-400">Date</span>
                <span className="font-medium text-gray-700">{row.starts_at}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-gray-400">Max Marks</span>
                <span className="font-medium text-gray-700">{row.max_marks}</span>
            </div>
          </div>

          {row.description ? (
            <p className="text-xs text-gray-500 line-clamp-2">{row.description}</p>
          ) : (
            <p className="text-xs text-gray-300 italic">No description provided</p>
          )}

          <div className="mt-auto pt-2 flex gap-2">
             <button className="flex-1 text-xs font-medium py-2 rounded-lg border border-border hover:bg-gray-50 transition-colors">
                View Details
             </button>
             <button className="px-3 py-2 rounded-lg border border-border hover:bg-gray-50 transition-colors">
                <AppIcon name="MoreHorizontal" size={14} />
             </button>
          </div>
        </Card>
      ))}
    </div>
  );
}
