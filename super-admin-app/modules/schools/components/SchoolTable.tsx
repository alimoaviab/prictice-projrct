"use client";

import { Button, DataTable } from "../../../components/ui";
import { schoolTableColumns } from "../constants/school.constants";
import { SchoolRow } from "../types/school.types";

export function SchoolTable({
  schools,
  onBlock
}: {
  schools: SchoolRow[];
  onBlock: (schoolId: string, blocked: boolean) => Promise<unknown>;
}) {
  return (
    <DataTable
      columns={[
        ...schoolTableColumns,
        {
          key: "actions",
          label: "Actions",
          render: (row) => (
            <Button
              variant={row.status === "blocked" ? "secondary" : "danger"}
              onClick={() => void onBlock(row.school_id, row.status !== "blocked")}
            >
              {row.status === "blocked" ? "Unblock" : "Block"}
            </Button>
          )
        }
      ]}
      rows={schools}
    />
  );
}
