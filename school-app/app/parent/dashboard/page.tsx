"use client";

import { Card } from "../../../components/ui";
import { SchoolShell } from "../../../layouts/SchoolShell";
import { colors, spacing, typography } from "@edu/shared/design-system/tokens";
import { TimetablePreview } from "../../../modules/timetable/components/TimetablePreview";
import { useAuth } from "../../../hooks/useAuth";

const summaries = [
  { title: "Daily Summary", detail: "4 classes, 1 homework due, attendance marked" },
  { title: "Academic Insights", detail: "Child's progress is steady in core subjects" },
  { title: "Upcoming Tasks", detail: "Science project and Mathematics test next week" }
];

export default function ParentDashboardPage() {
  const { user } = useAuth();
  
  return (
    <SchoolShell eyebrow="Parent Dashboard" title="Child's Academic Overview">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: spacing.md }}>
        {summaries.map((summary) => (
          <Card key={summary.title}>
            <h2 style={{ ...typography.h2, marginTop: 0 }}>{summary.title}</h2>
            <p style={{ ...typography.bodyMd, marginBottom: 0, color: colors.onSurfaceVariant }}>{summary.detail}</p>
          </Card>
        ))}
      </div>
      <div style={{ marginTop: spacing.md }}>
        <TimetablePreview classId={user?.classId} />
      </div>
    </SchoolShell>
  );
}
