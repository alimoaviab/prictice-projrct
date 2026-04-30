import { colors, spacing, typography } from "@edu/shared/design-system/tokens";
import { Card } from "./Card";

export function DataState({
  variant,
  title,
  message
}: {
  variant: "loading" | "empty" | "error";
  title: string;
  message?: string;
}) {
  return (
    <Card style={{ display: "grid", gap: spacing.xs }}>
      <strong style={{ ...typography.h3, color: variant === "error" ? colors.error : colors.onSurface }}>
        {title}
      </strong>
      {message ? <p style={{ ...typography.bodyMd, margin: 0, color: colors.onSurfaceVariant }}>{message}</p> : null}
    </Card>
  );
}
