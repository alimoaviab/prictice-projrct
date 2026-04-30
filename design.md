---
name: Multi-School Management System
colors:
  surface: '#f7fafc'
  surface-dim: '#d7dadc'
  surface-bright: '#f7fafc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f6'
  surface-container: '#ebeef0'
  surface-container-high: '#e5e9eb'
  surface-container-highest: '#e0e3e5'
  on-surface: '#181c1e'
  on-surface-variant: '#43474e'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eef1f3'
  outline: '#74777f'
  outline-variant: '#c4c6cf'
  surface-tint: '#455f88'
  primary: '#002045'
  on-primary: '#ffffff'
  primary-container: '#1a365d'
  on-primary-container: '#86a0cd'
  inverse-primary: '#adc7f7'
  secondary: '#0061a5'
  on-secondary: '#ffffff'
  secondary-container: '#66affe'
  on-secondary-container: '#004172'
  tertiary: '#002713'
  on-tertiary: '#ffffff'
  tertiary-container: '#003f23'
  on-tertiary-container: '#4bb278'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#adc7f7'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#2d476f'
  secondary-fixed: '#d2e4ff'
  secondary-fixed-dim: '#9fcaff'
  on-secondary-fixed: '#001d37'
  on-secondary-fixed-variant: '#00497e'
  tertiary-fixed: '#91f8b8'
  tertiary-fixed-dim: '#74db9d'
  on-tertiary-fixed: '#002110'
  on-tertiary-fixed-variant: '#00522f'
  background: '#f7fafc'
  on-background: '#181c1e'
  surface-variant: '#e0e3e5'
typography:
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: '0'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  table-header:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: '0'
  caption:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin: 32px
---

## Brand & Style

The brand personality is anchored in the concept of "Academic Authority meets Modern Efficiency." This design system is engineered for high-stakes administrative environments where trust and organization are paramount. It targets school administrators and district officials who manage complex datasets across multiple institutions.

The visual style is **Flat Plus**. This approach prioritizes the clarity of a flat aesthetic—utilizing generous whitespace and a strict grid—while introducing subtle depth through soft shadows and tonal layering. This depth serves a functional purpose: it distinguishes interactive management modules from static informational backgrounds, ensuring that users feel a sense of tactile control over their digital workspace.

## Colors

This design system utilizes a high-contrast palette designed for long-term legibility and professional rigor. 

- **Deep Navy (#1A365D):** Used for global navigation, headers, and primary branding to establish a sense of institutional stability and trust.
- **Action Blue (#3182CE):** Reserved strictly for primary interactive elements, such as call-to-action buttons, active states, and focus indicators.
- **Emerald Green (#38A169):** Communicates success, positive financial balances, and completed statuses.
- **Cool Gray (#F7FAFC):** Applied as the foundation for page backgrounds to reduce eye strain, with slightly darker variants used for card borders and secondary layout divisions.

## Typography

The typography system relies on **Inter**, chosen for its exceptional legibility in data-heavy environments. The hierarchy is strictly enforced to guide users through complex forms and dashboards.

Key decisions include the use of uppercase, tracked-out labels for table headers to distinguish them from row data, and a slightly tighter letter-spacing for large headlines to maintain a modern, "Swiss-style" corporate look. Body text defaults to a generous line height to ensure readability when processing student records and financial reports.

## Layout & Spacing

The layout is built on a **12-column fluid grid** with a fixed maximum width for high-resolution monitors to prevent data rows from becoming excessively long. 

A strict **8px spacing rhythm** governs the interface. All margins, padding, and component heights must be multiples of 8. For dashboards, a "split-screen" layout is often employed: a 280px fixed Deep Navy sidebar for global school switching, and a fluid Cool Gray content area for active management tasks. Gutters are set to 24px to provide enough breathing room between complex data cards.

## Elevation & Depth

Visual hierarchy in this design system is achieved through **Tonal Layers** and **Ambient Shadows**.

1.  **Background (Level 0):** Cool Gray (#F7FAFC).
2.  **Surface/Cards (Level 1):** White background with a 1px border (#E2E8F0) and a subtle, large-radius shadow (Y: 2px, Blur: 4px, Color: rgba(26, 54, 93, 0.05)).
3.  **Active/Floating (Level 2):** Modals and dropdowns use a more pronounced shadow (Y: 10px, Blur: 20px, Color: rgba(26, 54, 93, 0.12)) to indicate they are temporary overlays.

Shadows are tinted with the Deep Navy primary color rather than pure black to maintain a cohesive, sophisticated atmosphere.

## Shapes

The design system uses a consistent **8px (0.5rem)** corner radius for almost all components, including buttons, input fields, and container cards. This "Soft" rounding maintains a professional and organized look while feeling modern and accessible.

Smaller components like checkboxes and tags utilize a 4px radius to avoid looking too "bubbly" at small scales, while avatars and decorative icon containers may utilize full pill-shapes (circular) for quick visual identification.

## Components

### Buttons
Primary buttons use a solid Action Blue background with white text. Secondary buttons use a 1px Action Blue border with Action Blue text. All buttons have a height of 40px for standard actions and 8px corner radius.

### Input Fields
Inputs feature a white background, 1px Gray-200 border, and 8px corner radius. On focus, the border transitions to Action Blue with a subtle 2px glow of the same color. Labels are positioned above the field in a semi-bold `label-md` style.

### Data Tables
Tables are the heart of the system. They use a flat style with 1px horizontal dividers only. Row hover states use a very light tint of Action Blue (#EBF8FF) to help users track information horizontally.

### Cards
Cards are white with an 8px radius and a subtle shadow. They are used to group related metrics (e.g., student attendance, revenue) or to house individual form sections.

### Icons
Icons must be stroke-based (2px weight) and set in a 24x24px bounding box. Educational metaphors should be literal and recognizable: a graduation cap for academic records, a stack of coins for tuition/finance, and a classic book for curriculum.