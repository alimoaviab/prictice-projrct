import React from "react";
import { DataTableColumn } from "../../../components/ui/DataTable";
import { SchoolRow } from "../types/school.types";

export const schoolStatuses = ["pending", "approved", "rejected", "suspended"] as const;

export const schoolTableColumns: DataTableColumn<SchoolRow>[] = [
  { key: "name", label: "School Name", render: (row) => row.name },
  { key: "owner", label: "Owner Name", render: (row) => row.admin_profile?.name || "-" },
  { key: "email", label: "Email", render: (row) => row.admin_profile?.email || "-" },
  { key: "phone", label: "Phone", render: (row) => row.admin_profile?.phone || "-" },
  { key: "students", label: "Students", render: (row) => row.usage?.students ?? 0 },
  { key: "teachers", label: "Teachers", render: (row) => row.usage?.teachers ?? 0 },
  { key: "classes", label: "Classes", render: (row) => row.usage?.classes ?? 0 },
  { key: "plan", label: "Plan", render: (row) => (row.plan?.key || "free").toUpperCase() },
  { 
    key: "status", 
    label: "Status", 
    render: (row) => (
      <span style={{ 
        textTransform: "capitalize",
        fontWeight: 600,
        color: row.status === "approved" ? "#2e7d32" : row.status === "pending" ? "#ed6c02" : "#d32f2f"
      }}>
        {row.status}
      </span>
    ) 
  },
  { key: "created_at", label: "Created Date", render: (row) => new Date(row.created_at).toLocaleDateString() }
];
