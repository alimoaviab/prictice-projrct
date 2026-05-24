import { AppIcon } from "shared/ui/AppIcon";
import { Link, useLocation } from "react-router-dom";

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
  exams: "Exams",
  results: "Results",
  settings: "Settings",
  create: "Create",
  edit: "Edit",
};

export function Breadcrumb() {
  const { pathname } = useLocation();
  if (!pathname) return null;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return null;

  const items: BreadcrumbItem[] = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label =
      routeLabels[segment] ||
      segment.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    return { label, href: index < segments.length - 1 ? href : undefined };
  });

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-2 text-sm">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-2">
            {index > 0 && (
              <AppIcon name="ChevronRight" size={16} className="text-gray-300" />
            )}
            {item.href ? (
              <Link
                to={item.href}
                className="text-gray-500 hover:text-blue-600 transition-colors font-medium normal-case"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 font-semibold normal-case">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
