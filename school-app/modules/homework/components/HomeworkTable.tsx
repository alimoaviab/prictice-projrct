import { DataTable } from "../../../components/ui";
import { HomeworkRecordRow } from "../types/homework.types";

const columns = [
  {
    key: "due_at",
    label: "Due Date",
    render: (row: HomeworkRecordRow) => row.due_at
  },
  {
    key: "class_name",
    label: "Class",
    render: (row: HomeworkRecordRow) => row.class_name
  },
  {
    key: "subject",
    label: "Subject",
    render: (row: HomeworkRecordRow) => row.subject
  },
  {
    key: "title",
    label: "Title",
    render: (row: HomeworkRecordRow) => row.title
  },
  {
    key: "teacher_name",
    label: "Teacher",
    render: (row: HomeworkRecordRow) => `${row.teacher_employee_no} - ${row.teacher_name}`.trim()
  },
  {
    key: "status",
    label: "Status",
    render: (row: HomeworkRecordRow) => row.status
  }
];

export function HomeworkTable({ rows }: { rows: HomeworkRecordRow[] }) {
  return <DataTable columns={columns} rows={rows} />;
}
