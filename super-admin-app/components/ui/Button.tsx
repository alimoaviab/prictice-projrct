"use client";

import { colors, componentSizing, radius, spacing, typography } from "@edu/shared/design-system/tokens";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

export function Button({ variant = "primary", style, ...props }: ButtonProps) {
  const styles = {
    primary: {
      background: colors.actionBlue,
      border: `1px solid ${colors.actionBlue}`,
      color: colors.onPrimary
    },
    secondary: {
      background: colors.surfaceContainerLowest,
      border: `1px solid ${colors.actionBlue}`,
      color: colors.actionBlue
    },
    danger: {
      background: colors.error,
      border: `1px solid ${colors.error}`,
      color: colors.onError
    }
  }[variant];

  return (
    <button
      {...props}
      style={{
        ...typography.bodyMd,
        height: componentSizing.buttonHeight,
        borderRadius: radius.default,
        padding: `0 ${spacing.md}px`,
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.6 : 1,
        ...styles,
        ...style
      }}
    />
  );
}
