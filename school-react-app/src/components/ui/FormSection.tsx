import type { ReactNode } from "react";
import { colors, spacing, typography } from "@/lib/design-tokens";

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  columns?: 1 | 2 | 3;
}

export function FormSection({ title, description, children, columns = 2 }: FormSectionProps) {
  return (
    <div style={{ display: "grid", gap: spacing.md, marginBottom: spacing.lg }}>
      {(title || description) && (
        <div>
          <h3 style={{ ...typography.h3, margin: 0, marginBottom: spacing.xs, color: colors.onSurface }}>
            {title}
          </h3>
          {description && (
            <p style={{ ...typography.bodyMd, margin: 0, color: colors.onSurfaceVariant }}>
              {description}
            </p>
          )}
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            columns === 1 ? "1fr" : columns === 3 ? "repeat(3, 1fr)" : "repeat(2, 1fr)",
          gap: spacing.md,
        }}
      >
        {children}
      </div>
    </div>
  );
}

interface FormGroupProps {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}

export function FormGroup({ label, required = false, error, children }: FormGroupProps) {
  return (
    <div style={{ display: "grid", gap: spacing.xs }}>
      <label style={{ ...typography.labelMd, color: colors.onSurface }}>
        {label}
        {required && <span style={{ color: colors.error, marginLeft: spacing.xs / 2 }}>*</span>}
      </label>
      {children}
      {error && (
        <span style={{ ...typography.bodyMd, color: colors.error, fontSize: "12px" }}>
          {error}
        </span>
      )}
    </div>
  );
}
