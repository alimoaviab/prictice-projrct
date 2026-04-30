import { colors, spacing, typography } from "@edu/shared/design-system/tokens";
import { Card } from "./Card";

type DataStateVariant = "loading" | "empty" | "error" | "success";

export function DataState({
  variant,
  title,
  message
}: {
  variant: DataStateVariant;
  title: string;
  message?: string;
}) {
  const tone = variant === "error" ? colors.error : colors.onSurfaceVariant;

  return (
    <Card
      style={{
        display: "grid",
        gap: spacing.xs,
        borderColor: variant === "error" ? colors.errorContainer : colors.cardBorder
      }}
    >
      <strong style={{ ...typography.h3, color: tone }}>{title}</strong>
      {message ? <p style={{ ...typography.bodyMd, margin: 0, color: colors.onSurfaceVariant }}>{message}</p> : null}
    </Card>
  );
}
