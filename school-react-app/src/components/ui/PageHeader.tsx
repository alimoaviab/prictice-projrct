import { AppIcon } from "shared/ui/AppIcon";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  breadcrumb?: BreadcrumbItem[];
}

export function PageHeader({ title, subtitle, description, eyebrow, actions, breadcrumb }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {/* Breadcrumb */}
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="flex items-center gap-1.5 mb-3 text-xs text-slate-400">
          {breadcrumb.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <AppIcon name="ChevronRight" size={12} />}
              {item.href ? (
                <Link to={item.href} className="hover:text-blue-600 transition-colors font-medium">
                  {item.label}
                </Link>
              ) : (
                <span className="text-slate-600 font-semibold">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Eyebrow */}
      {eyebrow && (
        <div className="flex items-center gap-2 mb-1">
          <span className="h-px w-4 bg-blue-600/30" />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600/60">{eyebrow}</p>
        </div>
      )}

      {/* Title + Actions Row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
          {(subtitle || description) && (
            <p className="mt-1 text-sm font-medium text-slate-500 max-w-2xl">
              {subtitle || description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>

      {/* Divider */}
      <div className="mt-4 border-b border-slate-100" />
    </div>
  );
}
