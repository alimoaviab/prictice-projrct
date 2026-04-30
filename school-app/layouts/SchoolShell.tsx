"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { colors, layout, spacing, typography } from "@edu/shared/design-system/tokens";

const navItems = [
  { label: "Overview", href: "/admin/dashboard" },
  { label: "Academy Care", href: "/admin/academy-care" },
  { label: "Academic Years", href: "/admin/academic-years" },
  { label: "Classes", href: "/admin/classes" },
  { label: "Teachers", href: "/admin/teachers" },
  { label: "Students", href: "/admin/students" },
  { label: "Attendance", href: "/admin/attendance" },
  { label: "Homework", href: "/admin/homework" },
  { label: "Exams", href: "/admin/exams" },
  { label: "Results", href: "/admin/results" },
  { label: "Settings", href: "/admin/settings" }
];

export function SchoolShell({
  children,
  title,
  eyebrow
}: {
  children: React.ReactNode;
  title: string;
  eyebrow: string;
}) {
  const pathname = usePathname();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: `${layout.sidebarWidth}px 1fr`,
        background: colors.background,
        overflow: "hidden"
      }}
    >
      <aside
        style={{
          background: colors.primaryContainer,
          color: colors.onPrimary,
          padding: spacing.md,
          display: "grid",
          alignContent: "start",
          gap: spacing.md,
          minHeight: "100vh",
          position: "sticky",
          top: 0
        }}
      >
        <div style={{ ...typography.h3 }}>Academic Authority</div>
        <nav style={{ display: "grid", gap: spacing.xs }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    ...typography.bodyMd,
                    minHeight: 40,
                    display: "flex",
                    alignItems: "center",
                    padding: `0 ${spacing.sm}px`,
                    borderRadius: 8,
                    background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    color: colors.onPrimary
                  }}
                >
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main
        style={{
          padding: spacing.margin,
          maxWidth: layout.maxContentWidth,
          width: "100%",
          minWidth: 0,
          overflowX: "auto"
        }}
      >
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
