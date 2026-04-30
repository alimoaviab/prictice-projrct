import { DataTableColumn } from "../../../components/ui/DataTable";
import { StudentRow } from "../types/student.types";

export const studentStatuses = ["active", "inactive", "graduated", "transferred"] as const;

export const studentTableColumns: DataTableColumn<StudentRow>[] = [
  { key: "admission_no", label: "Admission", render: (row) => row.admission_no },
  { key: "name", label: "Student", render: (row) => `${row.first_name} ${row.last_name}` },
  { key: "section", label: "Section", render: (row) => row.section },
  { key: "guardian", label: "Guardian", render: (row) => row.guardian.name },
  { key: "status", label: "Status", render: (row) => row.status }
];
