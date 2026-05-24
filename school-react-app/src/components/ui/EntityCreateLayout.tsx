import { AppIcon } from "shared/ui/AppIcon";
/**
 * Shared "create-entity" page chrome.
 *
 * Locked to the Academic Year reference standard:
 *   max-w-7xl mx-auto py-2 px-4 sm:px-6
 *   lg:flex-row gap-8 items-start
 *   left form 68% / right guidance panel 32%
 *   rounded-[24px] cards with shadow-[0_8px_30px_rgb(0,0,0,0.04)]
 *   ring-1 ring-slate-900/5
 *   blue-600 accent icons in 9x9 rounded-lg containers
 *
 * Modules use this so the entire platform feels like one design system,
 * matching the Academic Year create page in spacing, typography rhythm,
 * card sizing, border radius, and right-side guidance panel structure.
 *
 * Top spacing is intentionally tight: parent SchoolShell pages now skip
 * their giant H1 block when no title is passed, so the in-card eyebrow
 * + form starts directly under the navbar with minimal gap.
 */

import { ReactNode } from "react";
import { Link } from "react-router-dom";

export interface EntityCreateLayoutProps {
  /** Path of the list page to return to. */
  backTo: string;
  /** Caption next to the back arrow. e.g., "Return to Sessions". */
  backLabel: string;
  /** Top-right eyebrow text. e.g., "System Configurator". */
  eyebrow?: string;
  /** Material symbol used in the 9x9 blue square. */
  icon: string;
  /** Form card title. e.g., "New Academic Session". */
  title: string;
  /** Form card subtitle. */
  subtitle?: string;
  /** Form card body. */
  children: ReactNode;
  /** Right-hand guidance panel. */
  aside: ReactNode;
  /** Optional title for the aside. Defaults to "Setup Intelligence". */
  asideTitle?: string;
  /** Optional eyebrow color. Defaults to emerald (live). */
  eyebrowDot?: "emerald" | "blue" | "amber" | "rose";
}

const eyebrowDotMap: Record<NonNullable<EntityCreateLayoutProps["eyebrowDot"]>, string> = {
  emerald: "bg-emerald-500",
  blue: "bg-blue-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
};

export function EntityCreateLayout({
  backTo,
  backLabel,
  eyebrow = "System Configurator",
  icon,
  title,
  subtitle,
  children,
  aside,
  asideTitle = "Setup Intelligence",
  eyebrowDot = "emerald",
}: EntityCreateLayoutProps) {
  return (
    <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6">
      <div className="mb-3 flex items-center justify-between">
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 normal-case  hover:text-slate-900 transition-all group"
        >
          <AppIcon name="ArrowLeft" size={16} className="text-[16px] group-hover:-translate-x-0.5 transition-transform" />
          {backLabel}
        </Link>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 normal-case ">
          <span className={`h-1.5 w-1.5 rounded-full ${eyebrowDotMap[eyebrowDot]} animate-pulse`} />
          {eyebrow}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="w-full lg:w-[68%]">
          <div className="bg-white border border-slate-200 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden ring-1 ring-slate-900/5 transition-all">
            <div className="relative px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white">
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                  <AppIcon name={icon} size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-none">{title}</h2>
                  {subtitle && (
                    <p className="text-[10px] text-slate-500 mt-1.5 font-medium">{subtitle}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-6">{children}</div>
          </div>
        </div>

        <div className="w-full lg:w-[32%] lg:sticky lg:top-8">
          <div className="bg-slate-50/80 border border-slate-200 rounded-[20px] p-5 ring-1 ring-slate-900/5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600">
                <AppIcon name="Info" size={16} />
              </div>
              <h3 className="text-[11px] font-bold text-slate-900 normal-case tracking-tight">{asideTitle}</h3>
            </div>
            <div className="space-y-5">{aside}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- */
/*  Helper sections for the right-hand guidance panel.                   */
/*  Use these so the typography rhythm matches Academic Year exactly.    */
/* --------------------------------------------------------------------- */

export function GuidanceSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h4 className="text-[10px] font-bold text-slate-400 normal-case  mb-1.5 flex items-center gap-2">
        <span className="h-1 w-1 rounded-full bg-slate-400" />
        {title}
      </h4>
      <p className="text-[11px] leading-relaxed text-slate-600 font-medium">{children}</p>
    </section>
  );
}

export function GuidanceCallout({
  tone = "blue",
  children,
}: {
  tone?: "blue" | "amber" | "emerald" | "rose";
  children: ReactNode;
}) {
  const map = {
    blue: "border-blue-100 bg-blue-50/50 text-blue-800",
    amber: "border-amber-100 bg-amber-50/50 text-amber-800",
    emerald: "border-emerald-100 bg-emerald-50/50 text-emerald-800",
    rose: "border-rose-100 bg-rose-50/50 text-rose-800",
  };
  return (
    <div className={`rounded-lg border p-2.5 ${map[tone]}`}>
      <p className="text-[10px] leading-snug font-bold">{children}</p>
    </div>
  );
}

export function GuidanceChecklist({
  items,
}: {
  items: Array<{ done: boolean; label: string }>;
}) {
  return (
    <div className="pt-2 border-t border-slate-200">
      <h4 className="text-[10px] font-bold text-slate-400 normal-case  mb-2.5">Quick Checklist</h4>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li
            key={i}
            className="flex items-center gap-2 text-[10px] font-medium text-slate-600"
          >
            <AppIcon name="CheckCircle2" size={14} className={`text-[14px] ${ it.done ? "text-emerald-500" : "text-slate-300" }`} />
            {it.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
