/**
 * Design tokens — ported 1:1 from school-react-app/src/lib/design-tokens.ts.
 * Numbers replace `px` strings (RN uses unitless dp values).
 *
 * If the web tokens change, update this file in lockstep.
 */

export const colors = {
  // Surfaces
  surface: '#F7FAFC',
  surfaceDim: '#D7DADC',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F1F4F6',
  surfaceContainer: '#EBEEF0',
  surfaceContainerHigh: '#E5E9EB',

  // Text
  onSurface: '#181C1E',
  onSurfaceVariant: '#43474E',
  textMuted: '#9CA3AF',
  textPlaceholder: '#D1D5DB',

  // Brand
  primary: '#2563EB', // blue-600 — matches the login button
  primaryDark: '#1D4ED8',
  primaryLight: '#DBEAFE',
  primaryNavy: '#002045',
  primaryContainer: '#1A365D',

  // Semantic
  success: '#38A169',
  successLight: '#DCFCE7',
  error: '#BA1A1A',
  errorLight: '#FFDAD6',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3182CE',
  infoLight: '#DBEAFE',

  // Borders / outlines
  outline: '#74777F',
  outlineVariant: '#C4C6CF',
  cardBorder: '#E2E8F0',
  rowHover: '#EBF8FF',

  // Pure
  white: '#FFFFFF',
  black: '#000000',

  // Gray scale
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xl2: 32,
  xl3: 40,
  xl4: 48,
  xl5: 64,
} as const;

export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xl2: 24,
  full: 9999,
} as const;

export const typography = {
  // Mirror the Inter cascade from the web.
  fontFamily: undefined as string | undefined, // RN falls back to system Inter-equivalent (San Francisco / Roboto).
  h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 38, letterSpacing: -0.6 },
  h2: { fontSize: 24, fontWeight: '700' as const, lineHeight: 30, letterSpacing: -0.3 },
  h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 26, letterSpacing: -0.2 },
  h4: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  bodyLg: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMd: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodySm: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  label: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16, letterSpacing: 0.4 },
  labelXs: { fontSize: 10, fontWeight: '700' as const, lineHeight: 14, letterSpacing: 0.6 },
  caption: { fontSize: 11, fontWeight: '400' as const, lineHeight: 14 },
} as const;

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  card: {
    shadowColor: '#1A365D',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  floating: {
    shadowColor: '#1A365D',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  primaryButton: {
    shadowColor: '#2563EB',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
} as const;
