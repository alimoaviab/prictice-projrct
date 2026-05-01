"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const routeLabels: Record<string, string> = {
  admin: "Dashboard",
  dashboard: "Overview",
  "academic-years": "Academic Years",
  classes: "Classes",
  teachers: "Teachers",
  students: "Students",
  attendance: "Attendance",
  homework: "Homework",
  exams: "Exams",
  results: "Results",
  settings: "Settings",
  create: "Create",
  edit: "Edit",
};

export function Breadcrumb() {
  const pathname = usePathname();
  if (!pathname) return null;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return null;

  const items: BreadcrumbItem[] = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = routeLabels[segment] || segment.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    return { label, href: index < segments.length - 1 ? href : undefined };
  });

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-2 text-sm">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-2">
            {index > 0 && (
              <span className="material-symbols-outlined text-gray-300 text-base">chevron_right</span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="text-gray-500 hover:text-blue-600 transition-colors font-medium capitalize"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 font-semibold capitalize">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
