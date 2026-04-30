"use client";

import { colors, spacing, typography } from "@edu/shared/design-system/tokens";
import { Card, DataState } from "../../../components/ui";
import { StudentForm } from "../components/StudentForm";
import { StudentTable } from "../components/StudentTable";
import { useStudents } from "../hooks/useStudents";

export function StudentsPage() {
  const { state, addStudent } = useStudents();

  return (
    <div style={{ display: "grid", gap: spacing.md }}>
      <Card>
        <h2 style={{ ...typography.h2, marginTop: 0 }}>Students</h2>
        <StudentForm onCreate={addStudent} />
      </Card>

      {state.status === "loading" || state.status === "idle" ? (
        <DataState variant="loading" title="Loading students" />
      ) : null}

      {state.status === "error" ? (
        <DataState variant="error" title="Students unavailable" message={state.error} />
      ) : null}

      {state.status === "empty" ? (
        <DataState variant="empty" title="No students found" message="Create the first student record for this school." />
      ) : null}

      {state.status === "success" ? (
        <Card style={{ padding: 0, overflow: "hidden", borderColor: colors.cardBorder }}>
          <StudentTable students={state.data} />
        </Card>
      ) : null}
    </div>
  );
}
