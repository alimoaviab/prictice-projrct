"use client";

import { colors, spacing, typography } from "@edu/shared/design-system/tokens";
import { Card } from "../../../components/ui";
import { ResultRow } from "../types/result.types";

export function ResultTable({ rows }: { rows: ResultRow[] }) {
  return (
    <div style={{ display: "grid", gap: spacing.md, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
      {rows.map((row) => (
        <Card key={row._id} style={{ display: "grid", gap: spacing.sm, borderColor: colors.cardBorder }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: spacing.sm, alignItems: "start" }}>
            <div>
              <h3 style={{ ...typography.h3, margin: 0, color: colors.onSurface }}>{row.student_name || row.admission_no}</h3>
              <p style={{ ...typography.bodyMd, margin: 0, color: colors.onSurfaceVariant }}>{row.exam_title}</p>
            </div>
            <span style={{ ...typography.labelMd, color: colors.actionBlue, textTransform: "uppercase" }}>{row.grade || "N/A"}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: spacing.sm }}>
            <div>
              <span style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>Marks</span>
              <div style={{ ...typography.bodyMd, color: colors.onSurface }}>
                {row.obtained_marks} / {row.max_marks}
              </div>
            </div>
            <div>
              <span style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>Class</span>
              <div style={{ ...typography.bodyMd, color: colors.onSurface }}>{row.class_name || row.class_id}</div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 4 }}>
            <span style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>Exam Subject</span>
            <strong style={{ ...typography.bodyMd, color: colors.onSurface }}>{row.exam_subject}</strong>
          </div>

          {row.remarks ? <p style={{ ...typography.bodyMd, margin: 0, color: colors.onSurfaceVariant }}>{row.remarks}</p> : null}
        </Card>
      ))}
    </div>
  );
}