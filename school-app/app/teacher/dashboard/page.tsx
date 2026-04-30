import { Button, Card } from "../../../components/ui";
import { SchoolShell } from "../../../layouts/SchoolShell";
import { colors, spacing, typography } from "@edu/shared/design-system/tokens";

const quickActions = ["Start Class", "Auto Attendance", "Homework", "Test"];
const insights = ["3 students absent repeatedly", "Low marks detected", "Homework submission drop detected"];

export default function TeacherDashboardPage() {
  return (
    <SchoolShell eyebrow="Teacher Dashboard" title="Teaching Workspace">
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: spacing.md }}>
        <Card>
          <h2 style={{ ...typography.h2, marginTop: 0 }}>Quick Actions</h2>
          <div style={{ display: "flex", gap: spacing.sm, flexWrap: "wrap" }}>
            {quickActions.map((action) => (
              <Button key={action}>{action}</Button>
            ))}
          </div>
        </Card>
        <Card>
          <h2 style={{ ...typography.h2, marginTop: 0 }}>Insight Panel</h2>
          <div style={{ display: "grid", gap: spacing.sm }}>
            {insights.map((insight) => (
              <div
                key={insight}
                style={{
                  ...typography.bodyMd,
                  padding: spacing.sm,
                  borderRadius: 8,
                  background: colors.surfaceContainerLow,
                  color: colors.onSurfaceVariant
                }}
              >
                {insight}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </SchoolShell>
  );
}
