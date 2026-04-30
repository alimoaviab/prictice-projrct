import { Card } from "../../components/ui";
import { PlatformShell } from "../../layouts/PlatformShell";
import { colors, spacing, typography } from "@edu/shared/design-system/tokens";

const metrics = [
  { title: "Schools", value: "128", detail: "Active tenants" },
  { title: "Usage", value: "84%", detail: "Seat utilization" },
  { title: "Logs", value: "42k", detail: "Audit events this month" },
  { title: "Blocked", value: "3", detail: "Schools under restriction" }
];

export default function PlatformDashboardPage() {
  return (
    <PlatformShell eyebrow="Super Admin" title="Platform Control">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: spacing.md }}>
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <span style={{ ...typography.labelMd, color: colors.onSurfaceVariant }}>{metric.title}</span>
            <strong style={{ ...typography.h2, display: "block", marginTop: spacing.xs }}>{metric.value}</strong>
            <p style={{ ...typography.bodyMd, marginBottom: 0, color: colors.onSurfaceVariant }}>{metric.detail}</p>
          </Card>
        ))}
      </div>
    </PlatformShell>
  );
}
