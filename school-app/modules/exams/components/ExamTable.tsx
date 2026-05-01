"use client";

import { colors, spacing, typography } from "@edu/shared/design-system/tokens";
import { Card } from "../../../components/ui";
import { ExamRow } from "../types/exam.types";

export function ExamTable({ rows }: { rows: ExamRow[] }) {
  return (
    <div style={{ display: "grid", gap: spacing.md, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
      {rows.map((row) => (
        <Card key={row._id} style={{ display: "grid", gap: spacing.sm, borderColor: colors.cardBorder }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: spacing.sm, alignItems: "start" }}>
            <div>
              <h3 style={{ ...typography.h3, margin: 0, color: colors.onSurface }}>{row.title}</h3>
              <p style={{ ...typography.bodyMd, margin: 0, color: colors.onSurfaceVariant }}>{row.subject}</p>
            </div>
            <span style={{ ...typography.labelMd, color: colors.actionBlue, textTransform: "uppercase" }}>{row.status}</span>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <span style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>Class</span>
            <strong style={{ ...typography.bodyMd, color: colors.onSurface }}>{row.class_name || row.class_id}</strong>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: spacing.sm }}>
            <div>
              <span style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>Date</span>
              <div style={{ ...typography.bodyMd, color: colors.onSurface }}>{row.starts_at}</div>
            </div>
            <div>
              <span style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>Max Marks</span>
              <div style={{ ...typography.bodyMd, color: colors.onSurface }}>{row.max_marks}</div>
            </div>
          </div>

          {row.description ? (
            <p style={{ ...typography.bodyMd, margin: 0, color: colors.onSurfaceVariant }}>{row.description}</p>
          ) : null}
        </Card>
      ))}
    </div>
  );
}