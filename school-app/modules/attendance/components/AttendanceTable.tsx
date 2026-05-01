import { DataTable } from "../../../components/ui";
import { AttendanceRecordRow } from "../types/attendance.types";

const columns = [
  {
    key: "date",
    label: "Date",
    render: (row: AttendanceRecordRow) => row.date
  },
  {
    key: "class_name",
    label: "Class",
    render: (row: AttendanceRecordRow) => row.class_name
  },
  {
    key: "admission_no",
    label: "Admission",
    render: (row: AttendanceRecordRow) => row.admission_no
  },
  {
    key: "student_name",
    label: "Student",
    render: (row: AttendanceRecordRow) => row.student_name
  },
  {
    key: "status",
    label: "Status",
    render: (row: AttendanceRecordRow) => row.status
  },
  {
    key: "note",
    label: "Note",
    render: (row: AttendanceRecordRow) => row.note || "-"
  }
];

export function AttendanceTable({ rows }: { rows: AttendanceRecordRow[] }) {
  return <DataTable columns={columns} rows={rows} />;
}
