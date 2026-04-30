import { colors, radius, shadows, spacing } from "@edu/shared/design-system/tokens";
import { HTMLAttributes } from "react";

export function Card({ style, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      {...props}
      style={{
        background: colors.surfaceContainerLowest,
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: radius.default,
        boxShadow: shadows.card,
        padding: spacing.md,
        ...style
      }}
    />
  );
}
