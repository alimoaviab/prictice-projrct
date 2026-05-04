import { Card } from "../../../components/ui";
import { SchoolShell } from "../../../layouts/SchoolShell";
import { colors, spacing, typography } from "@edu/shared/design-system/tokens";
import { TimetablePreview } from "../../../modules/timetable/components/TimetablePreview";

const summaries = [
  { title: "Daily Summary", detail: "4 classes, 1 homework due, attendance marked" },
  { title: "Weak Subjects", detail: "Mathematics and Physics need attention" },
  { title: "Upcoming Tasks", detail: "Science homework and English test" }
];

export default function StudentDashboardPage() {
  return (
    <SchoolShell eyebrow="Student Dashboard" title="Personal Academic View">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: spacing.md }}>
        {summaries.map((summary) => (
          <Card key={summary.title}>
            <h2 style={{ ...typography.h2, marginTop: 0 }}>{summary.title}</h2>
            <p style={{ ...typography.bodyMd, marginBottom: 0, color: colors.onSurfaceVariant }}>{summary.detail}</p>
          </Card>
        ))}
      </div>
      <div style={{ marginTop: spacing.md }}>
        <TimetablePreview />
      </div>
    </SchoolShell>
  );
}
