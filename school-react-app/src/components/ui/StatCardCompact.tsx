/**
 * Compact stat card. ~50% the visual mass of the legacy stat tile so
 * dashboards no longer feel oversized.
 *
 * Visual contract is locked to the Academic Year reference standard:
 *   - rounded-xl, ring-1 ring-slate-900/5, border border-slate-200
 *   - 9x9 rounded-lg accent square
 *   - eyebrow label uses text-[10px] font-bold text-slate-400 normal-case
 *   - hero numeral uses text-lg font-bold text-slate-900 tracking-tight
 *
 * Use this everywhere the dashboard previously rendered a 5-12 padded
 * tile with an h-11 w-11 icon. Drop-in replacement.
 */

import { ReactNode } from "react";
import { Link } from "react-router-dom";

export type StatCardAccent =
  | "blue"
  | "emerald"
  | "purple"
  | "amber"
  | "rose"
  | "slate";

const accentMap: Record<StatCardAccent, { iconBg: string; iconText: string }> = {
  blue: { iconBg: "bg-blue-50", iconText: "text-blue-600" },
  emerald: { iconBg: "bg-emerald-50", iconText: "text-emerald-600" },
  purple: { iconBg: "bg-purple-50", iconText: "text-purple-600" },
  amber: { iconBg: "bg-amber-50", iconText: "text-amber-600" },
  rose: { iconBg: "bg-rose-50", iconText: "text-rose-600" },
  slate: { iconBg: "bg-slate-100", iconText: "text-slate-600" },
};

export interface StatCardCompactProps {
  label: string;
  value: ReactNode;
  icon: string;
  accent?: StatCardAccent;
  hint?: string;
  to?: string;
  onClick?: () => void;
  className?: string;
}

export function StatCardCompact({
  label,
  value,
  icon,
  accent = "blue",
  hint,
  to,
  onClick,
  className = "",
}: StatCardCompactProps) {
  const { iconBg, iconText } = accentMap[accent];

  const inner = (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg} ${iconText} shrink-0 transition-transform group-hover:scale-105`}
      >
        <span className="material-symbols-outlined text-lg">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-slate-400 normal-case truncate">
          {label}
        </p>
        <p className="mt-0.5 text-lg font-bold text-slate-900 tracking-tight leading-none truncate">
          {value}
        </p>
        {hint && (
          <p className="mt-1 text-[10px] font-medium text-slate-400 truncate">
            {hint}
          </p>
        )}
      </div>
    </div>
  );

  const baseClass =
    "group bg-white rounded-xl border border-slate-200 ring-1 ring-slate-900/5 px-3.5 py-3 shadow-[0_4px_18px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] hover:-translate-y-0.5 transition-all";

  if (to) {
    return (
      <Link to={to} className={`${baseClass} block ${className}`}>
        {inner}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClass} text-left w-full ${className}`}
      >
        {inner}
      </button>
    );
  }

  return <div className={`${baseClass} ${className}`}>{inner}</div>;
}

export interface StatCardGridItem {
  label: string;
  value: ReactNode;
  icon: string;
  accent?: StatCardAccent;
  hint?: string;
  to?: string;
  onClick?: () => void;
}

/**
 * Convenience grid for the standard 4-up dashboard stat row.
 * Falls back to 2 columns on mobile, 4 columns from md upwards.
 */
export function StatCardGrid({ items }: { items: StatCardGridItem[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((item, i) => (
        <StatCardCompact key={`${item.label}-${i}`} {...item} />
      ))}
    </div>
  );
}
