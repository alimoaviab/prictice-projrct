import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card } from "./Card";
import { Button } from "./Button";

interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: string;
}

interface EmptyStateProps {
  title: string;
  description: string;
  hint?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  icon?: ReactNode | string;
  tone?: "default" | "info" | "success" | "warning";
}

const toneToBg: Record<NonNullable<EmptyStateProps["tone"]>, string> = {
  default: "bg-blue-50 text-blue-600",
  info: "bg-blue-50 text-blue-600",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
};

export function EmptyState({
  title,
  description,
  hint,
  action,
  secondaryAction,
  icon,
  tone = "default",
}: EmptyStateProps) {
  const accent = toneToBg[tone];
  const iconContent =
    typeof icon === "string" ? (
      <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${accent}`}>
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>
    ) : icon ? (
      <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${accent}`}>{icon}</div>
    ) : (
      <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${accent}`}>
        <span className="material-symbols-outlined text-3xl">inbox</span>
      </div>
    );

  return (
    <Card className="flex flex-col items-center justify-center border-dashed border-2 px-4 py-10 text-center md:px-8">
      {iconContent}
      <h3 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {hint && <p className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-slate-400">{hint}</p>}

      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {action &&
            (action.href ? (
              <Link
                to={action.href}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/15 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-blue-600/20 active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-lg">{action.icon ?? "add"}</span>
                {action.label}
              </Link>
            ) : (
              <Button onClick={action.onClick} variant="primary">
                <span className="material-symbols-outlined text-lg">{action.icon ?? "add"}</span>
                {action.label}
              </Button>
            ))}

          {secondaryAction &&
            (secondaryAction.href ? (
              <Link
                to={secondaryAction.href}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-700"
              >
                {secondaryAction.icon && (
                  <span className="material-symbols-outlined text-base">{secondaryAction.icon}</span>
                )}
                {secondaryAction.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-700"
              >
                {secondaryAction.icon && (
                  <span className="material-symbols-outlined text-base">{secondaryAction.icon}</span>
                )}
                {secondaryAction.label}
              </button>
            ))}
        </div>
      )}
    </Card>
  );
}
