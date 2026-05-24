import { AppIcon } from "shared/ui/AppIcon";
/**
 * Universal entity grid wrapper. Standardizes the responsive grid every
 * list page uses for cards.
 *
 * Locked behaviour:
 *   - Mobile (< md):  1 column
 *   - Tablet (md):    2 columns
 *   - Desktop (lg+):  3 columns
 *
 * No xl:grid-cols-4 — we want a stable 3-up layout on every screen ≥1024px.
 * Cards stretch to equal height because each parent grid cell already
 * matches its sibling's max content height (CSS grid behaviour).
 */

import { ReactNode } from "react";
import { Skeleton } from "./Skeleton";

export function EntityGrid({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Skeleton loader for the entity grid. Renders the same 3-up shape as the
 * real grid, with N placeholder cards.
 */
export function EntityGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <EntityGrid>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-[180px] w-full rounded-xl" />
      ))}
    </EntityGrid>
  );
}

/**
 * Empty-state card sized to fit the grid container (so it doesn't look
 * lonely when there's a single card-grid section below filters).
 */
export function EntityGridEmpty({
  icon = "inbox",
  title,
  message,
  action,
}: {
  icon?: string;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 ring-1 ring-slate-900/5 shadow-[0_4px_18px_rgb(0,0,0,0.03)] px-6 py-10 text-center">
      <div className="flex flex-col items-center justify-center gap-4 max-w-sm mx-auto">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <AppIcon name={icon} size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
          {message && (
            <p className="text-[13px] text-slate-500 font-medium leading-relaxed">{message}</p>
          )}
        </div>
        {action}
      </div>
    </div>
  );
}
