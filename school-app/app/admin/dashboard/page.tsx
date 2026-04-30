import { Card } from "../../../components/ui";
import { SchoolShell } from "../../../layouts/SchoolShell";
import { colors, spacing, typography } from "@edu/shared/design-system/tokens";

const sections = [
  { title: "Overview", value: "1,248", detail: "Active students" },
  { title: "Operations", value: "86", detail: "Teachers and classes" },
  { title: "Finance", value: "$42.8k", detail: "Outstanding fees" },
  { title: "Academic", value: "14", detail: "Upcoming exams" },
  { title: "Monitoring", value: "92%", detail: "Attendance rate" }
];

export default function AdminDashboardPage() {
  return (
    <SchoolShell eyebrow="Admin Dashboard" title="School Control Center">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: spacing.md }}>
        {sections.map((section) => (
          <Card key={section.title}>
            <span style={{ ...typography.labelMd, color: colors.onSurfaceVariant }}>{section.title}</span>
            <strong style={{ ...typography.h2, display: "block", marginTop: spacing.xs }}>{section.value}</strong>
            <p style={{ ...typography.bodyMd, marginBottom: 0, color: colors.onSurfaceVariant }}>{section.detail}</p>
          </Card>
        ))}
      </div>
    </SchoolShell>
  );
}
