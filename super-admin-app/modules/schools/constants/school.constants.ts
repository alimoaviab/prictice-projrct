import { DataTableColumn } from "../../../components/ui/DataTable";
import { SchoolRow } from "../types/school.types";

export const schoolStatuses = ["active", "suspended", "blocked"] as const;

export const schoolTableColumns: DataTableColumn<SchoolRow>[] = [
  { key: "name", label: "School", render: (row) => row.name },
  { key: "code", label: "Code", render: (row) => row.code },
  { key: "status", label: "Status", render: (row) => row.status },
  { key: "plan", label: "Plan", render: (row) => row.plan?.key ?? "starter" },
  { key: "students", label: "Students", render: (row) => row.usage?.students ?? 0 },
  { key: "storage", label: "Storage MB", render: (row) => row.usage?.storage_mb ?? 0 }
];
