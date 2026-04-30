import { DataTable } from "../../../components/ui";
import { studentTableColumns } from "../constants/student.constants";
import { StudentRow } from "../types/student.types";

export function StudentTable({ students }: { students: StudentRow[] }) {
  return <DataTable columns={studentTableColumns} rows={students} />;
}
