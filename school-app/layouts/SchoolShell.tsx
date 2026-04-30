import { colors, layout, spacing, typography } from "@edu/shared/design-system/tokens";

const navItems = ["Overview", "Students", "Teachers", "Classes", "Attendance", "Homework", "Exams", "Fees"];

export function SchoolShell({
  children,
  title,
  eyebrow
}: {
  children: React.ReactNode;
  title: string;
  eyebrow: string;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: `${layout.sidebarWidth}px 1fr`,
        background: colors.background
      }}
    >
      <aside
        style={{
          background: colors.primaryContainer,
          color: colors.onPrimary,
          padding: spacing.md,
          display: "grid",
          alignContent: "start",
          gap: spacing.md
        }}
      >
        <div style={{ ...typography.h3 }}>Academic Authority</div>
        <nav style={{ display: "grid", gap: spacing.xs }}>
          {navItems.map((item) => (
            <div
              key={item}
              style={{
                ...typography.bodyMd,
                minHeight: 40,
                display: "flex",
                alignItems: "center",
                padding: `0 ${spacing.sm}px`,
                borderRadius: 8,
                background: item === "Overview" ? "rgba(255,255,255,0.12)" : "transparent"
              }}
            >
              {item}
            </div>
          ))}
        </nav>
      </aside>
      <main style={{ padding: spacing.margin, maxWidth: layout.maxContentWidth, width: "100%" }}>
        <header style={{ display: "grid", gap: spacing.xs, marginBottom: spacing.md }}>
          <span style={{ ...typography.labelMd, color: colors.onSurfaceVariant, textTransform: "uppercase" }}>
            {eyebrow}
          </span>
          <h1 style={{ ...typography.h1, margin: 0 }}>{title}</h1>
        </header>
        {children}
      </main>
    </div>
  );
}
