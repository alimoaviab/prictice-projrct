/**
 * Ported 1:1 from old-app/shared/design-system/tokens.ts. FormSection and a
 * handful of legacy UIs read from these constants. Keep the values identical
 * so the layouts remain pixel-equivalent.
 */

export const colors = {
  surface: "#f7fafc",
  surfaceDim: "#d7dadc",
  surfaceBright: "#f7fafc",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f1f4f6",
  surfaceContainer: "#ebeef0",
  surfaceContainerHigh: "#e5e9eb",
  surfaceContainerHighest: "#e0e3e5",
  onSurface: "#181c1e",
  onSurfaceVariant: "#43474e",
  inverseSurface: "#2d3133",
  inverseOnSurface: "#eef1f3",
  outline: "#74777f",
  outlineVariant: "#c4c6cf",
  primary: "#002045",
  primaryContainer: "#1a365d",
  onPrimary: "#ffffff",
  secondary: "#0061a5",
  onSecondary: "#ffffff",
  tertiary: "#002713",
  success: "#38A169",
  error: "#ba1a1a",
  onError: "#ffffff",
  errorContainer: "#ffdad6",
  background: "#f7fafc",
  actionBlue: "#3182CE",
  rowHover: "#EBF8FF",
  cardBorder: "#E2E8F0",
} as const;

export const typography = {
  h1: { fontFamily: "Inter, system-ui, sans-serif", fontSize: "32px", fontWeight: 700, lineHeight: "1.2", letterSpacing: "-0.02em" },
  h2: { fontFamily: "Inter, system-ui, sans-serif", fontSize: "24px", fontWeight: 600, lineHeight: "1.3", letterSpacing: "-0.01em" },
  h3: { fontFamily: "Inter, system-ui, sans-serif", fontSize: "20px", fontWeight: 600, lineHeight: "1.4", letterSpacing: "0" },
  bodyLg: { fontFamily: "Inter, system-ui, sans-serif", fontSize: "16px", fontWeight: 400, lineHeight: "1.6", letterSpacing: "0" },
  bodyMd: { fontFamily: "Inter, system-ui, sans-serif", fontSize: "14px", fontWeight: 400, lineHeight: "1.5", letterSpacing: "0" },
  tableHeader: { fontFamily: "Inter, system-ui, sans-serif", fontSize: "12px", fontWeight: 600, lineHeight: "1.2", letterSpacing: "0.05em", textTransform: "uppercase" as const },
  labelMd: { fontFamily: "Inter, system-ui, sans-serif", fontSize: "12px", fontWeight: 500, lineHeight: "1.2", letterSpacing: "0" },
  caption: { fontFamily: "Inter, system-ui, sans-serif", fontSize: "11px", fontWeight: 400, lineHeight: "1.2", letterSpacing: "0.01em" },
} as const;

export const spacing = {
  base: 8,
  xs: 4,
  sm: 12,
  md: 24,
  lg: 40,
  xl: 64,
  gutter: 24,
  margin: 32,
} as const;

export const radius = {
  sm: "0.25rem",
  default: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.5rem",
  full: "9999px",
} as const;

export const shadows = {
  card: "0 2px 4px rgba(26, 54, 93, 0.05)",
  floating: "0 10px 20px rgba(26, 54, 93, 0.12)",
} as const;
